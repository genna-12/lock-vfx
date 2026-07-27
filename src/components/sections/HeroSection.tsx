import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Play, Sparkles, ArrowRight } from 'lucide-react';
import { GlassButton } from '../glass/GlassButton';
import { GlassCard } from '../glass/GlassCard';

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Background Atmosphere & Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-87.5 bg-[#E60B18]/15 rounded-full blur-[140px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-10 right-10 w-100 h-100 bg-blue-600/10 rounded-full blur-[160px] pointer-events-none transform-gpu" />

      {/* Hero Central Content */}
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Floating Brand Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/4 border border-white/10 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E60B18]" />
          <span className="text-xs font-medium tracking-widest text-zinc-300 uppercase">
            {t('hero.badge')}
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6"
        >
          {t('hero.title')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <GlassButton variant="primary" size="lg" onClick={() => window.location.href = '#portfolio'}>
            <span>{t('hero.ctaWork')}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </GlassButton>

          <GlassButton variant="secondary" size="lg" onClick={() => window.location.href = '#contact'}>
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Showreel 2026</span>
          </GlassButton>
        </motion.div>

        {/* Studio Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
        >
          {[
            { value: '120+', label: 'VFX Shots Delivered' },
            { value: '4K/8K', label: 'Pipeline Ready' },
            { value: '100%', label: 'On-Time Delivery' },
            { value: '24/7', label: 'Production Support' },
          ].map((stat, idx) => (
            <GlassCard key={idx} variant="low" className="p-4 text-center">
              <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-1 font-medium">{stat.label}</div>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
};