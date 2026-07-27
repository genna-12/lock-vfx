import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { PORTFOLIO_PROJECTS, type VfxProject } from '../../data/portfolioData';
import { GlassCard } from './../glass/GlassCard';
import { ProjectModal } from './../ui/ProjectModal';

export const PortfolioSection: React.FC = () => {
  const { i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<VfxProject | null>(null);

  const categories = [
    { key: 'all', label: 'All Projects' },
    { key: 'compositing', label: 'Compositing' },
    { key: 'cgi', label: '3D & CGI' },
    { key: 'fx', label: 'FX Simulation' },
    { key: 'environments', label: 'Environments' },
  ];

  const filteredProjects =
    activeCategory === 'all'
      ? PORTFOLIO_PROJECTS
      : PORTFOLIO_PROJECTS.filter((p) => p.category === activeCategory);

  return (
    <section id="portfolio" className="py-24 px-6 relative max-w-6xl mx-auto">
      {/* Section Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#E60B18] mb-2">
            Selected Works
          </h2>
          <h3 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Feature Film & Commercial VFX
          </h3>
        </div>

        {/* Interactive Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-[#E60B18] text-white shadow-[0_0_15px_rgba(230,11,24,0.4)]'
                  : 'bg-white/4 text-zinc-400 hover:text-white border border-white/8 hover:bg-white/8'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard
                variant="medium"
                className="group cursor-pointer p-0 overflow-hidden"
                onClick={() => setSelectedProject(project)}
              >
                {/* Image Container with Hover Zoom */}
                <div className="relative aspect-video overflow-hidden bg-zinc-950">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#07080a] via-transparent to-transparent opacity-80" />

                  {/* Glass Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-xs">
                    <div className="w-14 h-14 rounded-full bg-[#E60B18] text-white flex items-center justify-center shadow-[0_0_25px_rgba(230,11,24,0.6)] transform group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
                      {project.categoryLabel}
                    </span>
                  </div>
                </div>

                {/* Card Meta Text */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-[#E60B18] transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">{project.client}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mt-3 leading-relaxed">
                    {i18n.language === 'it' ? project.descriptionIt : project.descriptionEn}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/8">
                    {project.services.map((service, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Video Breakdown Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </section>
  );
};