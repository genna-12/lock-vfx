import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { type VfxProject } from '../../data/portfolioData';

interface ProjectModalProps {
  project: VfxProject;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const { i18n } = useTranslation();

  // Chiudi premendo tasto ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop sfocato */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />

      {/* Finestra Modal Glass */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0D0E12]/90 border border-white/15 rounded-3xl overflow-hidden shadow-2xl z-10 transform-gpu"
      >
        {/* Pulsante Chiusura */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#E60B18] text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          <iframe
            src={project.videoUrl}
            title={project.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Detalii Progetto */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
              <span className="text-xs text-[#E60B18] font-semibold uppercase tracking-wider">
                {project.categoryLabel} • {project.year}
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">{project.title}</h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-white/6 text-zinc-300 border border-white/10">
              {project.client}
            </span>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed mb-6">
            {i18n.language === 'it' ? project.descriptionIt : project.descriptionEn}
          </p>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {project.services.map((service, index) => (
              <span
                key={index}
                className="text-xs px-3 py-1 rounded-lg bg-white/4 text-zinc-400 border border-white/8"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};