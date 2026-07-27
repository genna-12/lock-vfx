import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/8 bg-[#07080a] py-12 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <span className="text-white font-semibold tracking-wider text-lg">
            LOCK <span className="text-[#E60B18]">VFX</span>
          </span>
          <p className="text-zinc-500 text-xs mt-1">
            {t('footer.tagline')}
          </p>
        </div>

        <div className="flex items-center gap-6 text-zinc-400 text-sm">
          <a href="https://vimeo.com" target="_blank" rel="noreferrer" className="hover:text-[#E60B18] transition-colors">Vimeo</a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#E60B18] transition-colors">Instagram</a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#E60B18] transition-colors">LinkedIn</a>
          <a href="https://artstation.com" target="_blank" rel="noreferrer" className="hover:text-[#E60B18] transition-colors">ArtStation</a>
        </div>

        <p className="text-zinc-600 text-xs">
          © {new Date().getFullYear()} Lock VFX. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
};