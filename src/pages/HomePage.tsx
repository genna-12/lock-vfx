import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Cpu, Film } from 'lucide-react';
import { TechData, ClientData } from '../data/studioData';
import { InfiniteMarquee } from '../components/ui/InfiniteMarquee';
import { GlassCard } from '../components/glass/GlassCard';
import { Footer } from '../components/layout/Footer';

export const HomePage: React.FC = () => {
  const { i18n } = useTranslation();
  const isIt = i18n.language === 'it';

  return (
    <div className="min-h-screen flex flex-col justify-between pt-0 relative overflow-hidden">
      {/* 1. HERO VIDEO BACKGROUND SECTION */}
      <section className="relative w-full h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Placeholder Video o Loop di Sfondo dei ragazzi dello studio */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-35 scale-105 filter blur-[1px]"
            poster="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop"
          >
            {/* Sostituire questo src con il file mp4 finale dei ragazzi dello studio */}
            <source src="https://assets.mixkit.co/videos/preview/mixkit-sci-fi-tunnel-loop-41552-large.mp4" type="video/mp4" />
          </video>
          {/* Sfumatura inferiore per transizione liquida con lo scroll */}
          <div className="absolute inset-0 bg-linear-to-b from-[#08090C]/40 via-[#08090C]/60 to-[#08090C]" />
        </div>

        {/* Hero Glass Typography */}
        <div className="relative z-10 max-w-4xl text-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/4 border border-white/10 backdrop-blur-xl mb-6 shadow-2xl"
          >
            <span className="w-2 h-2 rounded-full bg-[#D3121B] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-300 uppercase">
              VISUAL EFFECTS STUDIO • 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08]"
          >
            {isIt ? 'Plasmare la Realtà' : 'Crafting Invisible Reality'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm sm:text-lg text-zinc-400 max-w-xl mx-auto mt-6 leading-relaxed"
          >
            {isIt
              ? 'Studio di effetti visivi ad alta precisione. Specializzati in CGI, compositing complesso e simulazioni fisiche per il cinema.'
              : 'High-end visual effects studio specializing in CGI, deep compositing, and physical simulations for feature films.'}
          </motion.p>
        </div>
      </section>

      {/* 2. FILOSOFIA DI LAVORO (WORKFLOW SECTION) */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#D3121B] mb-2">
            {isIt ? 'Come Lavoriamo' : 'Our Workflow'}
          </h2>
          <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            {isIt ? 'Rigore Tecnico & Visione Artistica' : 'Technical Precision Meets Film Vision'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard variant="low" className="p-8">
            <Film className="w-8 h-8 text-[#D3121B] mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">
              {isIt ? 'Pipeline Cinematografica ACES' : 'ACES Cinematic Pipeline'}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {isIt
                ? 'Ogni shot segue un flusso di lavoro calibrato in spazio colore ACES, garantendo la massima fedeltà visiva tra la camera sul set e il compositing finale.'
                : 'Every shot follows a strict ACES color-managed workflow, ensuring absolute visual accuracy between onset plates and final compositing.'}
            </p>
          </GlassCard>

          <GlassCard variant="low" className="p-8">
            <Cpu className="w-8 h-8 text-[#D3121B] mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">
              {isIt ? 'Integrazione 3D & Simulazioni' : '3D Integration & Physics'}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {isIt
                ? 'Dalle simulazioni procedurali in Houdini all\'estensione digitale degli ambienti, integriamo elementi CGI invisibili nel girato dal vivo.'
                : 'From procedural Houdini simulations to digital matte environment extensions, we seamlessly blend CGI with live-action footage.'}
            </p>
          </GlassCard>
        </div>
      </section>

      {/* 3. MARQUEE INFINITO SOFTWARE & TECNOLOGIE */}
      <section className="relative z-10 py-12 border-y border-white/6 bg-white/1 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 mb-6 flex justify-between items-center">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            {isIt ? 'Software & Stack Tecnologico' : 'Software & Pipeline Stack'}
          </span>
          <span className="text-[10px] text-[#D3121B] font-mono">2026 READY</span>
        </div>

        <InfiniteMarquee speed={30}>
          {TechData.items.map((tech) => (
            <div
              key={tech.id}
              className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-xl shrink-0"
            >
              <div className="w-2 h-2 rounded-full bg-[#D3121B]/70" />
              <div>
                <div className="text-xs font-bold text-white">{tech.name}</div>
                <div className="text-[10px] text-zinc-500 font-mono">{tech.category}</div>
              </div>
            </div>
          ))}
        </InfiniteMarquee>
      </section>

      {/* 4. MARQUEE INFINITO CLIENTE & PRODUZIONI */}
      <section className="relative z-10 py-12">
        <div className="max-w-5xl mx-auto px-6 mb-6 flex justify-between items-center">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
            {isIt ? 'Partner & Clienti' : 'Trusted By Studios & Brands'}
          </span>
        </div>

        <InfiniteMarquee speed={35}>
          {ClientData.items.map((client) => (
            <div
              key={client.id}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/2 border border-white/6 shrink-0 hover:border-white/15 transition-colors"
            >
              <span className="text-sm font-semibold tracking-wide text-zinc-300">
                {client.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-500 font-mono">
                {client.roleOrCategory}
              </span>
            </div>
          ))}
        </InfiniteMarquee>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};