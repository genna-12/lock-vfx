import * as THREE from 'three';
import React from 'react';
import { useGLTF } from '@react-three/drei';

const MODEL_PATH = '/models/lock-vfx-studio.glb';
useGLTF.preload(MODEL_PATH);

/**
 * Fattore di correzione scala: il modello reale (Body: X≈5.92, Y≈5.66,
 * Z≈2.0 unità) è circa 3.7× più grande delle unità con cui avevamo tarato
 * posizioni/traiettorie usando la geometria procedurale placeholder.
 * Valore calcolato dal bounding box del file ricevuto — è il primo numero
 * da ritarare a vista una volta visto renderizzato nella scena reale.
 */
export const MODEL_SCALE = 0.34;

interface LockModelProps {
  crimsonMatRef: React.RefObject<THREE.MeshStandardMaterial | null>;
  shackleRef: React.RefObject<THREE.Mesh | null>;
}

/**
 * Carica Body + Shackle dal file reale (nominati esattamente come da
 * specifica — bel lavoro di chi l'ha modellato). Materiali NOSTRI, non
 * quelli baked nel file: ci serve il riferimento al materiale del Body
 * per l'emissive che pulsa, e teniamo un metallo argento sulla staffa
 * finché LockVFX non manda una versione con materiali definitivi (nel
 * file ricevuto entrambe le mesh condividono lo stesso rosso — quasi
 * certamente un placeholder di comodo, non una scelta finale).
 */
export const LockModel: React.FC<LockModelProps> = ({ crimsonMatRef, shackleRef }) => {
  const { nodes } = useGLTF(MODEL_PATH) as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };

  return (
    <group scale={MODEL_SCALE}>
      <mesh geometry={nodes.Body.geometry}>
        <meshStandardMaterial
          ref={crimsonMatRef}
          color="#E60B18"
          emissive="#E60B18"
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>
      <mesh ref={shackleRef} geometry={nodes.Shackle.geometry}>
        <meshStandardMaterial color="#E5E7EB" roughness={0.12} metalness={0.95} />
      </mesh>
    </group>
  );
};