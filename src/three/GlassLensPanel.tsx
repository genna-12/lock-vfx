import * as THREE from 'three';
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Image } from '@react-three/drei';
import type { MotionValue } from 'framer-motion';
import { scrollEnvelope } from './scrollEnvelope';

interface GlassLensPanelProps {
  rawImg: string;
  editedImg: string;
  progress: MotionValue<number>;
  window: [number, number, number, number];
  position: [number, number, number];
  size: [number, number];
}

const lensVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Nucleo NITIDO e piatto fino all'80% del raggio (nessuna deformazione,
// nessun blur — è la lettura diretta della texture). Solo nel 20% esterno
// (dal bordo verso l'interno) un vetro vero: rifrazione radiale +
// aberrazione cromatica, la stessa tecnica del reference FluidGlass, non
// un blur — un vetro rifrange, non sfoca uniformemente.
const lensFragmentShader = /* glsl */ `
  uniform sampler2D uRawTex;
  uniform vec2 uCenterUV;
  uniform float uDiscUV;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered) * 2.0; // 0 = centro, 1 = bordo del disco
    vec2 dir = dist > 0.0001 ? centered / (dist * 0.5) : vec2(0.0);

    // rimT: 0 nel nucleo nitido (fino all'80% del raggio), 1 al bordo estremo
    float rimT = smoothstep(0.8, 1.0, dist);

    float refractStrength = rimT * 0.045;
    vec2 refractOffset = dir * refractStrength;

    float caStrength = rimT * 0.012;
    vec2 uvR = uCenterUV + (centered + refractOffset + dir * caStrength) * uDiscUV * 2.0;
    vec2 uvG = uCenterUV + (centered + refractOffset) * uDiscUV * 2.0;
    vec2 uvB = uCenterUV + (centered + refractOffset - dir * caStrength) * uDiscUV * 2.0;

    float r = texture2D(uRawTex, uvR).r;
    float g = texture2D(uRawTex, uvG).g;
    float b = texture2D(uRawTex, uvB).b;

    // Sottile highlight speculare appena dentro al bordo — vende il "vetro"
    float specular = smoothstep(0.9, 0.97, dist) * (1.0 - smoothstep(0.97, 1.02, dist)) * 0.35;

    float alpha = 1.0 - smoothstep(0.85, 1.03, dist);
    gl_FragColor = vec4(vec3(r, g, b) + specular, alpha * uOpacity);
  }
`;

/**
 * Riquadro con lente RAW vs EDITED.
 *
 * v6 — riscritta senza FBO/portal: rawImg e editedImg sono immagini
 * statiche, non una scena live da catturare a runtime — inutile il
 * meccanismo (ereditato dal reference) pensato per contenuto dinamico.
 * Qui la lente è un semplice disco con uno shader dedicato che campiona
 * direttamente la texture RAW, centrato e sfocato come sopra.
 */
export const GlassLensPanel: React.FC<GlassLensPanelProps> = ({
  rawImg,
  editedImg,
  progress,
  window: revealWindow,
  position,
  size,
}) => {
  const { pointer, camera, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const lensRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lastTarget = useRef<[number, number]>([0, 0]);

  const rawTexture = useTexture(rawImg);

  const [w, h] = size;
  const [x0, y0, z0] = position;
  const [inStart, inEnd, outStart, outEnd] = revealWindow;
  const lensDiameter = Math.min(w, h) * 0.6;

  const uniforms = useMemo(
    () => ({
      uRawTex: { value: rawTexture },
      uCenterUV: { value: new THREE.Vector2(0.5, 0.5) },
      uDiscUV: { value: lensDiameter / 2 / Math.max(w, h) },
      uOpacity: { value: 0 },
    }),
    [rawTexture, lensDiameter, w, h]
  );

  useFrame((_, delta) => {
    const p = progress.get();
    const reveal = scrollEnvelope(p, inStart, inEnd, outStart, outEnd);
    const s = THREE.MathUtils.lerp(0.55, 1, reveal);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(s);
      groupRef.current.visible = reveal > 0.01;
      groupRef.current.position.set(x0, y0 + (1 - reveal) * 0.45, z0);
      groupRef.current.rotation.z = (1 - reveal) * -0.07;
    }

    const halfW = (s * w) / 2;
    const halfH = (s * h) / 2;
    const vp = viewport.getCurrentViewport(camera, [x0, y0, z0]);
    const dx = pointer.x * (vp.width / 2) - x0;
    const dy = pointer.y * (vp.height / 2) - y0;

    if (lensRef.current) {
      const insideBox = reveal > 0.5 && Math.abs(dx) <= halfW && Math.abs(dy) <= halfH;
      if (insideBox) lastTarget.current = [dx, dy];
      const [tx, ty] = lastTarget.current;
      lensRef.current.position.x = THREE.MathUtils.damp(lensRef.current.position.x, tx, 6, delta);
      lensRef.current.position.y = THREE.MathUtils.damp(lensRef.current.position.y, ty, 6, delta);

      if (materialRef.current) {
        materialRef.current.uniforms.uOpacity.value = reveal;
        const u = 0.5 + lensRef.current.position.x / w;
        const v = 0.5 + lensRef.current.position.y / h; // era invertito (0.5 - ...): la lente mostrava il lato opposto
        materialRef.current.uniforms.uCenterUV.value.set(u, v);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Image url={editedImg} scale={[w, h]} position={[0, 0, 0]} radius={0.16} />

      <mesh ref={lensRef} position={[0, 0, 0.05]}>
        <circleGeometry args={[lensDiameter / 2, 48]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={lensVertexShader}
          fragmentShader={lensFragmentShader}
          transparent
        />
      </mesh>
    </group>
  );
};