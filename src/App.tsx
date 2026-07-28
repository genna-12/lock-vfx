import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './utils/i18n';

import { AmbientBackground } from './components/layout/AmbientBackground';
import { VerticalNavbar } from './components/layout/VerticalNavbar';
import { HeaderOverlay } from './components/layout/HeaderOverlay';

// Pagine
import { HomePage } from './pages/HomePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#08090C] text-zinc-100 font-sans relative antialiased selection:bg-[#D3121B] selection:text-white">
        {/* Sfondo dinamico morbido */}
        <AmbientBackground />

        {/* UI Layout Elements */}
        <VerticalNavbar />
        <HeaderOverlay />

        {/* Contenuto Principale Multi-Pagina */}
        <main className="relative z-10 md:pl-28 min-h-screen flex flex-col justify-between">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;