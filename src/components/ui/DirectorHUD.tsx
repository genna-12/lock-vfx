import React, { useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'framer-motion';
import { HUD_MOTIF } from '../../brand/tokens';

interface DirectorHUDProps {
  progress: MotionValue<number>;
}

function formatTimecode(p: number) {
  // Puramente scenico: non misura nulla di reale, restituisce un timecode
  // stile SMPTE che "scorre" con lo scroll — coerente col linguaggio
  // visivo di uno studio di montaggio/color-grading.
  const totalFrames = Math.round(p * 5999);
  const ff = totalFrames % HUD_MOTIF.frameRate;
  const totalSeconds = Math.floor(totalFrames / HUD_MOTIF.frameRate);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `00:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
}


/**
 * "Director's Monitor": il motivo visivo ricorrente del brand LockVFX.
 * Sostituisce le particelle generiche con qualcosa che ha un motivo
 * tematico per esistere — l'estetica di un monitor da regia/color-grading,
 * non decorazione a caso. Aggiornamento del timecode via DOM diretto
 * (nessun re-render React a 60fps: mutiamo `textContent` su un ref, è la
 * tecnica standard per counter legati allo scroll).
 */
export const DirectorHUD: React.FC<DirectorHUDProps> = ({ progress }) => {
  const timecodeRef = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(progress, 'change', (p) => {
    if (timecodeRef.current) timecodeRef.current.textContent = formatTimecode(p);
  });

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {/* Bracket ai quattro angoli — arretrati rispetto al vero bordo dello
          schermo perché navbar (collassata) e language switcher vivono
          entrambi fissi a 24px dagli angoli superiori (vedi LockVfxNavbar
          COLLAPSED_OFFSET e LanguageSwitcher `top-6 right-6`): il frame
          cinematico cede il vero angolo alla UI globale, che resta sopra
          in gerarchia, e si posiziona appena più internamente. */}
      {/* Bracket ai quattro angoli — negli angoli veri. La navbar (collassata)
          e il language switcher ci passano sopra: la soluzione al
          "coprimento" è che il loro vetro sfochi visibilmente queste linee
          dietro, non spostare l'HUD (vedi LockVfxNavbar/LanguageSwitcher). */}
      <div className="absolute top-6 left-6 w-6 h-6 border-t border-l border-[#E60B18]/35" />
      <div className="absolute top-6 right-6 w-6 h-6 border-t border-r border-[#E60B18]/35" />
      <div className="absolute bottom-10 left-8 w-6 h-6 border-b border-l border-[#E60B18]/35" />
      <div className="absolute bottom-10 right-8 w-6 h-6 border-b border-r border-[#E60B18]/35" />

      {/* Indicatore "REC" — richiamo diretto al monitor di ripresa */}
      <div className="absolute bottom-10 left-16 flex items-center gap-2 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E60B18] animate-pulse" />
        <span className="text-[10px] tracking-[0.3em] text-[#E60B18]/70">REC</span>
      </div>

      {/* Timecode scenico — sostituisce il vecchio indicatore di debug "%" */}
      <div className="absolute bottom-10 right-16 font-mono text-[10px] tracking-widest text-[#6B7280]">
        <span ref={timecodeRef}>00:00:00:00</span>
      </div>

      {/* Scanline con un accenno di "reverbero": un secondo tratto sfasato
          nel tempo, più sfocato e più flebile, che insegue il primo come
          un'eco fosforescente da tubo catodico — non solo una linea che
          scorre, ha una scia. Entrambe leggermente più visibili di prima. */}
      <div className="absolute inset-x-0 h-px bg-white/6 shadow-[0_0_10px_2px_rgba(255,255,255,0.1)] animate-[scan-drift_9s_linear_infinite]" />
      <div className="absolute inset-x-0 h-px bg-white/3 blur-[1.5px] animate-[scan-drift_9s_linear_infinite] [animation-delay:0.35s]" />
    </div>
  );
};