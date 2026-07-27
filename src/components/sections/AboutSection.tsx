import React from 'react';
import { useTranslation } from 'react-i18next';
// import { motion } from 'framer-motion';
import { Cpu, Layers, Zap, Film } from 'lucide-react';
import { GlassCard } from '../glass/GlassCard';

export const AboutSection: React.FC = () => {
  const { i18n } = useTranslation();

  const isIt = i18n.language === 'it';

  const toolchain = [
    { name: 'SideFX Houdini', role: 'Procedural FX & Simulation', level: 'Core' },
    { name: 'Foundry Nuke Studio', role: 'Deep Compositing & Keying', level: 'Core' },
    { name: 'Autodesk Maya / ZBrush', role: '3D Modeling & Rigging', level: 'Core' },
    { name: 'Unreal Engine 5', role: 'Real-time & Virtual Production', level: 'Next-Gen' },
    { name: 'DaVinci Resolve Studio', role: 'Color Grading & Finishing', level: 'Master' },
  ];

  const features = [
    {
      icon: <Layers className="w-6 h-6 text-[#E60B18]" />,
      title: isIt ? 'Pipeline Cinematografica Non-Lineare' : 'Non-Linear Cinematic Pipeline',
      desc: isIt
        ? 'Integrazione perfetta tra 3D, simulazioni fisiche e compositing avanzato in Nuke e Houdini.'
        : 'Seamless integration between 3D, physical simulations, and deep Nuke/Houdini compositing.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-[#E60B18]" />,
      title: isIt ? 'Render Farm & Accelerazione GPU' : 'GPU Render Farm Acceleration',
      desc: isIt
        ? 'Tempi di consegna calcolati al secondo grazie a cluster di rendering GPU dedicati e scalabili.'
        : 'Precision turnaround times backed by scalable GPU rendering clusters.',
    },
    {
      icon: <Zap className="w-6 h-6 text-[#E60B18]" />,
      title: isIt ? 'Assistenza On-Set & Matchmoving' : 'On-Set Supervision & Matchmoving',
      desc: isIt
        ? 'Dalla supervisione del set durante le riprese al tracciamento 3D ad altissima accuratezza.'
        : 'From live set supervision during shooting to sub-pixel 3D camera tracking.',
    },
    {
      icon: <Film className="w-6 h-6 text-[#E60B18]" />,
      title: isIt ? 'Standard di Consegna Cinema 8K' : '8K Master Cinema Delivery',
      desc: isIt
        ? 'Workflow ACES completo con spazio colore calibrato per produzioni cinematografiche e streaming.'
        : 'Full ACES color-managed workflow calibrated for feature films and high-end streaming.',
    },
  ];

  return (
    <section id="about" className="py-24 px-6 relative max-w-6xl mx-auto">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 -left-32 w-96 h-96 bg-[#E60B18]/10 rounded-full blur-[150px] pointer-events-none transform-gpu" />

      {/* Header */}
      <div className="max-w-3xl mb-16">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#E60B18] mb-2">
          {isIt ? 'Chi Siamo & Filosofia' : 'About & Philosophy'}
        </h2>
        <h3 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-6">
          {isIt ? 'Dove l\'Arte Digitale Incontra la Fisica' : 'Where Digital Art Meets Physics'}
        </h3>
        <p className="text-zinc-400 text-base leading-relaxed">
          {isIt
            ? 'Lock VFX è uno studio indipendente specializzato in effetti visivi di altissima qualità per il cinema, la televisione e gli spot commerciali. Fondiamo tecnologia all\'avanguardia e sensibilità artistica per rendere invisibile l\'impossibile.'
            : 'Lock VFX is an independent visual effects studio specializing in high-end VFX for cinema, television, and commercial campaigns. We merge cutting-edge technology with artistic direction to render the impossible invisible.'}
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {features.map((feat, idx) => (
          <GlassCard key={idx} variant="medium" className="p-8">
            <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/10 flex items-center justify-center mb-6">
              {feat.icon}
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{feat.title}</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
          </GlassCard>
        ))}
      </div>

      {/* Software Toolchain Section */}
      <GlassCard variant="low" className="p-8 sm:p-10 border-white/10">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E60B18]" />
          {isIt ? 'Pipeline & Software Stack VFX' : 'VFX Pipeline & Software Stack'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolchain.map((tool, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white/3 border border-white/6 flex justify-between items-center"
            >
              <div>
                <div className="text-sm font-bold text-white">{tool.name}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{tool.role}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#E60B18]/15 text-[#FF2A38] font-mono border border-[#E60B18]/30">
                {tool.level}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
};