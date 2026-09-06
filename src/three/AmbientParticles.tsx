import * as THREE from 'three';
import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const COUNT = 240;

export const AmbientParticles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  // Soluzione Errore 1: useState con inizializzazione lazy (evita Math.random nel render)
  const [positions] = useState(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }
    return arr;
  });

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.006;
    pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.2;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        {/* Soluzione Errore 2: passaggio dell'array tramite la prop obbligatoria `args` */}
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#E60B18"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};