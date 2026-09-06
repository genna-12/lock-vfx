import * as THREE from 'three';
import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { easing } from 'maath';
import { GlassLensPanel } from '../../three/GlassLensPanel';
import { LockModel } from '../../three/LockModel';
import { DirectorHUD } from '../ui/DirectorHUD';
import { StageReveal, RevealItem } from '../ui/StageReveal';
import { PolaroidCard } from '../ui/PolaroidCard';
import { FilmStripMarquee } from '../ui/FilmStripMarquee';
import { AmbientBackground } from '../ui/AmbientBackground';
import { useGsapScrollSnap } from '../../hooks/useGsapScrollSnap';

// Confini stage, allineati alla tabella "Master Flow" della spec.
const STAGE = {
  showreel: [0, 0.15] as const,
  ingress: [0.15, 0.35] as const,
  lens: [0.35, 0.6] as const,
  clients: [0.6, 0.85] as const,
  footer: [0.85, 1] as const,
};

// Punti di sosta per il magnete di scroll: al centro del "plateau" di ogni
// stage con contenuto da guardare/usare — MAI vicino al confine footer
// (era la causa del taglio a metà: lo sticky si sblocca proprio lì).
const PAUSE_POINTS = [0.08, 0.47, 0.72];

const POLAROID_OFFSETS = [0, 26, -14, 38, 4]; // px — respiro organico da bacheca vera
const POLAROID_CLIENTS = ['Northlight Films', 'Reel Eight', 'Orbital Studio', 'Client 04', 'Client 05']; // TODO: nomi veri

// Le due coppie ricevute da LockVFX — vedi note sulla cartella /public/images/lens/
const WORKS = [
  { raw: '/images/lens/raw-01.webp', edited: '/images/lens/edited-01.webp' },
  { raw: '/images/lens/raw-02.webp', edited: '/images/lens/edited-02.webp' },
];

// Offset della staffa come DELTA da 0 (chiusa) — non più posizione assoluta:
// la geometria reale ha già la sua posizione "a riposo" corretta modellata,
// qui aggiungiamo solo quanto farla "scattare" più in alto per aprirsi.
const SHACKLE_CLOSED = 0;
const SHACKLE_OPEN = 1.15;

interface LockProps {
  progress: MotionValue<number>;
  work: { raw: string; edited: string };
}

const Lock3DKinetics: React.FC<LockProps> = ({ progress, work }) => {
  const { pointer, camera, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const shackleRef = useRef<THREE.Mesh>(null);
  const crimsonMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Rotazione idle continua + "colpo di giri" quando passi veloce col mouse
  const idleSpin = useRef(0);
  const spinBoost = useRef(0);
  const prevPointer = useRef<[number, number]>([0, 0]);

  // Posizione world corrente del lucchetto (aggiornata a fine frame), usata
  // sia per il test "il mouse è vicino?" sia dal listener di click qui sotto.
  const lockWorldPos = useRef<[number, number, number]>([0, 0, -1]);

  // Easter egg: click vicino al lucchetto → si sblocca visivamente un istante
  const unlockAt = useRef<number | null>(null);

  useEffect(() => {
    const onClick = () => {
      const [x0, y0, z0] = lockWorldPos.current;
      const vp = viewport.getCurrentViewport(camera, [x0, y0, z0]);
      const wx = pointer.x * (vp.width / 2);
      const wy = pointer.y * (vp.height / 2);
      if (Math.hypot(wx - x0, wy - y0) < 1.3) {
        unlockAt.current = performance.now();
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [camera, viewport, pointer]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const p = progress.get();

    let targetX = 0;
    let targetY = 0;
    let targetZ: number;
    let targetRotX = 0;
    let targetRotY = 0;
    let targetScale: number;
    let shackleOffsetY = SHACKLE_CLOSED;

    if (p <= STAGE.showreel[1]) {
      targetScale = 0;
      targetZ = -15;
    } else if (p <= STAGE.ingress[1]) {
      const t = (p - STAGE.ingress[0]) / (STAGE.ingress[1] - STAGE.ingress[0]);
      targetScale = THREE.MathUtils.lerp(0, 1.25, t);
      targetZ = THREE.MathUtils.lerp(-15, -1, t);
      targetRotY = t * Math.PI * 2;
    } else if (p <= STAGE.lens[1]) {
      const t = (p - STAGE.lens[0]) / (STAGE.lens[1] - STAGE.lens[0]);
      targetScale = 1.1;
      targetX = THREE.MathUtils.lerp(0, -2.6, t);
      targetY = THREE.MathUtils.lerp(0, 1.1, t);
      targetZ = THREE.MathUtils.lerp(-1, -1.2, t);
      targetRotX = 0.25;
      targetRotY = Math.PI * 2 + t * Math.PI * 1.3;
      shackleOffsetY = THREE.MathUtils.lerp(SHACKLE_CLOSED, SHACKLE_OPEN, t);
    } else if (p <= STAGE.clients[1]) {
      const t = (p - STAGE.clients[0]) / (STAGE.clients[1] - STAGE.clients[0]);
      targetScale = 1.1;
      targetX = THREE.MathUtils.lerp(-2.6, 2.6, t);
      targetY = 1.1;
      targetZ = -1.2;
      targetRotX = -0.2;
      targetRotY = Math.PI * 3.3 + t * Math.PI * 2;
      shackleOffsetY = SHACKLE_OPEN;
    } else {
      const t = (p - STAGE.footer[0]) / (STAGE.footer[1] - STAGE.footer[0]);
      targetX = THREE.MathUtils.lerp(2.6, -3.2, t);
      targetY = THREE.MathUtils.lerp(1.1, -1.85, t);
      targetZ = THREE.MathUtils.lerp(-1.2, 0.6, t);
      targetScale = THREE.MathUtils.lerp(1.1, 0.5, t);
      shackleOffsetY = THREE.MathUtils.lerp(SHACKLE_OPEN, SHACKLE_CLOSED, t);
    }

    // --- "Vivo anche da fermo": rotazione idle continua ---
    // Velocità del puntatore in coordinate NDC (indipendente dal frame rate)
    const dx = pointer.x - prevPointer.current[0];
    const dy = pointer.y - prevPointer.current[1];
    prevPointer.current = [pointer.x, pointer.y];
    const pointerSpeed = Math.hypot(dx, dy) / Math.max(delta, 0.001);

    // Il lucchetto "sente" il mouse solo se è abbastanza vicino nello spazio reale
    const [lx, ly, lz] = lockWorldPos.current;
    const vpNow = viewport.getCurrentViewport(camera, [lx, ly, lz]);
    const pointerWorldX = pointer.x * (vpNow.width / 2);
    const pointerWorldY = pointer.y * (vpNow.height / 2);
    const nearLock = Math.hypot(pointerWorldX - lx, pointerWorldY - ly) < 1.6;

    if (nearLock && pointerSpeed > 1.2) {
      spinBoost.current = Math.min(spinBoost.current + pointerSpeed * 0.6, 14);
    }
    spinBoost.current *= 0.94; // decade da solo verso la velocità di base
    idleSpin.current += (0.15 + spinBoost.current) * delta;

    targetRotY += pointer.x * 0.25 + idleSpin.current;
    targetRotX += pointer.y * 0.15;

    // --- Easter egg: click vicino al lucchetto → la staffa "scatta" aperta
    // e si richiude da sola, come se si sbloccasse per un istante ---
    if (unlockAt.current !== null) {
      const elapsed = (performance.now() - unlockAt.current) / 1000;
      if (elapsed < 1.4) {
        shackleOffsetY += Math.exp(-elapsed * 3.2) * Math.sin(elapsed * 9) * (SHACKLE_OPEN * 0.85);
      } else {
        unlockAt.current = null;
      }
    }

    easing.damp3(groupRef.current.position, [targetX, targetY, targetZ], 0.14, delta);
    easing.dampE(groupRef.current.rotation, [targetRotX, targetRotY, 0], 0.14, delta);
    easing.damp3(groupRef.current.scale, [targetScale, targetScale, targetScale], 0.14, delta);
    lockWorldPos.current = [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z];

    if (shackleRef.current) {
      easing.damp3(shackleRef.current.position, [0, shackleOffsetY, 0], 0.12, delta);
    }
    if (crimsonMatRef.current) {
      crimsonMatRef.current.emissiveIntensity = Math.sin(p * Math.PI * 6) * 0.3 + 0.3;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <LockModel crimsonMatRef={crimsonMatRef} shackleRef={shackleRef} />
      </group>

      <GlassLensPanel
        rawImg={work.raw}
        editedImg={work.edited}
        progress={progress}
        window={[0.37, 0.44, 0.56, 0.6]}
        position={[2.9, 0.5, -0.3]}
        size={[3.6, 2.5]}
      />
    </>
  );
};

export const MasterLockScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visionActive, setVisionActive] = useState(false);
  const [workIndex, setWorkIndex] = useState(0);
  const [clientsActive, setClientsActive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useGsapScrollSnap(containerRef, { points: PAUSE_POINTS });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setVisionActive(latest > STAGE.lens[0] + 0.02 && latest < STAGE.lens[1] - 0.02);
    setClientsActive(latest > STAGE.clients[0] + 0.02 && latest < STAGE.clients[1] - 0.02);
  });

  const showreelOpacity = useTransform(scrollYProgress, [0, 0.13, STAGE.showreel[1]], [1, 1, 0]);
  const showreelScale = useTransform(scrollYProgress, [0, STAGE.showreel[1]], [1, 0.94]);
  const showreelRadius = useTransform(scrollYProgress, [0, STAGE.showreel[1]], [0, 32]);

  const visionOpacity = useTransform(
    scrollYProgress,
    [STAGE.ingress[1], STAGE.lens[0] + 0.03, STAGE.lens[1] - 0.03, STAGE.lens[1]],
    [0, 1, 1, 0]
  );
  const visionX = useTransform(scrollYProgress, [STAGE.ingress[1], STAGE.lens[0] + 0.05], [-24, 0]);

  // Tipografia cinetica: un breve artefatto da "chromatic split" sul titolo
  // Vision, ma non a caso — coincide esattamente col momento in cui il
  // lucchetto transita verso l'angolo in alto a sinistra dove vive il testo
  // (inizio Stage 2). È lo stesso "sistema nervoso" a muovere lucchetto e testo.
  const glitchAmount = useTransform(
    scrollYProgress,
    [STAGE.lens[0], STAGE.lens[0] + 0.05, STAGE.lens[0] + 0.11],
    [0, 3, 0]
  );
  const titleShadow = useTransform(
    glitchAmount,
    (v) =>
      `${v}px 0 0 rgba(230,11,24,0.55), ${-v}px 0 0 rgba(56,189,248,0.4), 0 8px 50px rgba(0,0,0,0.9)`
  );

  // Letterboxing cinematico: due barre nere sottili che si aprono per un
  // attimo esattamente ai confini tra stage (transizione di "scena"),
  // come un cambio di inquadratura — un solo motion value che somma
  // un impulso stretto per ciascun confine, mai per il plateau di uno stage.
  const stageBoundaries = [STAGE.showreel[1], STAGE.ingress[1], STAGE.lens[1], STAGE.clients[1]];
  const letterboxIntensity = useTransform(scrollYProgress, (p) => {
    let peak = 0;
    for (const b of stageBoundaries) {
      const d = Math.abs(p - b);
      peak = Math.max(peak, Math.max(0, 1 - d / 0.02));
    }
    return peak;
  });
  const letterboxHeight = useTransform(letterboxIntensity, (v) => v * 44);

  const clientsOpacity = useTransform(
    scrollYProgress,
    [STAGE.lens[1], STAGE.clients[0] + 0.03, STAGE.clients[1] - 0.03, STAGE.clients[1]],
    [0, 1, 1, 0]
  );


  return (
    <div ref={containerRef} className="relative h-[600vh] w-full bg-[#020202]">
      <div className="sticky top-0 h-screen w-full overflow-hidden isolate">
        <AmbientBackground />

        <Canvas camera={{ position: [0, 0, 7], fov: 40 }} className="z-10 pointer-events-none absolute inset-0">
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-5, -5, -5]} intensity={2} color="#E60B18" />
          <Suspense fallback={null}>
            <Environment preset="city" />
            <Float speed={1.6} rotationIntensity={0.18} floatIntensity={0.28}>
              <Lock3DKinetics progress={scrollYProgress} work={WORKS[workIndex]} />
            </Float>
          </Suspense>
        </Canvas>

        {/* ---------- STAGE 0: Showreel ----------
             Placeholder attuale: immagine statica. Quando LockVFX manda un
             video reale, sostituire questo <img> con <video autoPlay loop
             muted playsInline src="/images/showreel.mp4" ...> */}
        <motion.div
          style={{ opacity: showreelOpacity, scale: showreelScale, borderRadius: showreelRadius }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <img
            src="/images/showreel-poster.webp"
            alt="Showreel LockVFX"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-transparent to-[#020202]/60" />
        </motion.div>

        {/* ---------- STAGE 2: Vision (sinistra) + Lens box UI (destra) ---------- */}
        <motion.div
          style={{ opacity: visionOpacity, x: visionX }}
          className="absolute inset-0 z-20 flex items-center pointer-events-none px-8 md:px-20"
        >
          <div className="pointer-events-none max-w-xl">
            <StageReveal active={visionActive} className="flex flex-col gap-5">
              <RevealItem>
                <div className="flex items-center gap-3">
                  <motion.span
                    className="h-px bg-[#E60B18]"
                    initial={{ width: 0 }}
                    animate={{ width: visionActive ? 44 : 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <p className="text-xs uppercase tracking-[0.4em] text-[#E60B18] font-mono">Vision</p>
                </div>
              </RevealItem>
              <RevealItem>
                <motion.h2
                  style={{ textShadow: titleShadow }}
                  className="text-4xl md:text-6xl font-light text-[#F3F4F6] leading-[1.05]"
                >
                  Precisione nel <span className="font-semibold text-[#E60B18]">compositing</span>
                </motion.h2>
              </RevealItem>
              <RevealItem>
                <p className="text-[#9CA3AF] text-base leading-relaxed max-w-md [text-shadow:0_2px_24px_rgba(0,0,0,0.95)]">
                  Dalla modellazione 3D al compositing fotorealistico: ogni frame viene
                  ricostruito fotogramma per fotogramma per produzioni cinematografiche
                  internazionali.
                </p>
              </RevealItem>
            </StageReveal>
          </div>

          <div
            data-cursor="lens"
            data-active={visionActive ? 'true' : 'false'}
            className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 w-140 h-100 pointer-events-none"
          />

          {/* Frecce per cambiare lavoro — dalla spec originale, mai
              implementate finora perché non avevamo ancora coppie reali */}
          <div
            className="hidden md:flex absolute right-10 items-center gap-3 pointer-events-auto"
            style={{ top: 'calc(50% + 210px)' }}
          >
            <button
              aria-label="Lavoro precedente"
              data-cursor="click"
              onClick={() => setWorkIndex((i) => (i + WORKS.length - 1) % WORKS.length)}
              className="w-9 h-9 rounded-full border border-white/15 text-[#9CA3AF] hover:text-white hover:border-white/30 transition-colors flex items-center justify-center"
            >
              ←
            </button>
            <span className="font-mono text-[10px] tracking-widest text-[#6B7280]">
              {String(workIndex + 1).padStart(2, '0')} / {String(WORKS.length).padStart(2, '0')}
            </span>
            <button
              aria-label="Lavoro successivo"
              data-cursor="click"
              onClick={() => setWorkIndex((i) => (i + 1) % WORKS.length)}
              className="w-9 h-9 rounded-full border border-white/15 text-[#9CA3AF] hover:text-white hover:border-white/30 transition-colors flex items-center justify-center"
            >
              →
            </button>
          </div>
        </motion.div>

        {/* ---------- STAGE 3: Moodboard clienti (sinistra) + Titolo (destra) ---------- */}
        <motion.div
          style={{ opacity: clientsOpacity }}
          className="absolute inset-0 z-20 flex items-center justify-between pointer-events-none px-8 md:px-24"
        >
          <div className="hidden md:flex flex-wrap gap-x-10 gap-y-6 max-w-xl pointer-events-auto">
            {/* TODO: sostituire il rettangolo grigio con il vero video/immagine del progetto cliente */}
            {POLAROID_OFFSETS.map((offset, i) => (
              <PolaroidCard
                key={i}
                offset={offset}
                rotate={i % 2 === 0 ? -3 : 2}
                clientName={POLAROID_CLIENTS[i]}
              />
            ))}
          </div>
          <StageReveal active={clientsActive} className="max-w-sm text-right ml-auto flex flex-col gap-4 items-end">
            <RevealItem>
              <div className="flex items-center gap-3 flex-row-reverse">
                <motion.span
                  className="h-px bg-[#E60B18]"
                  initial={{ width: 0 }}
                  animate={{ width: clientsActive ? 44 : 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
                <p className="text-xs uppercase tracking-[0.4em] text-[#E60B18] font-mono">Trust</p>
              </div>
            </RevealItem>
            <RevealItem>
              <h2 className="text-4xl md:text-5xl font-light text-[#F3F4F6] leading-[1.05] [text-shadow:0_8px_50px_rgba(0,0,0,0.9)]">
                Ecco alcuni dei nostri <span className="font-semibold">clienti</span>
              </h2>
            </RevealItem>
          </StageReveal>

          <FilmStripMarquee active={clientsActive} />
        </motion.div>

        {/* ---------- STAGE 4: nessun overlay — solo il lucchetto che si aggancia
             in fondo, poi lo scroll consegna naturalmente al vero footer
             (SiteFooter in HomePage.tsx). ---------- */}

        <DirectorHUD progress={scrollYProgress} />

        {/* Letterboxing cinematico: si apre solo nei confini tra stage */}
        <motion.div
          style={{ height: letterboxHeight }}
          className="absolute top-0 left-0 right-0 z-45 bg-black pointer-events-none"
        />
        <motion.div
          style={{ height: letterboxHeight }}
          className="absolute bottom-0 left-0 right-0 z-45 bg-black pointer-events-none"
        />
      </div>
    </div>
  );
};