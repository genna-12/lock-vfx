import React from 'react';
import './utils/i18n'; // Inizializzazione i18n
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/sections/HeroSection';
import { PortfolioSection } from './components/sections/PortfolioSection';
import { AboutSection } from './components/sections/AboutSection';
import { ContactSection } from './components/sections/ContactSection';
import { Footer } from './components/layout/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080A] text-zinc-100 font-sans selection:bg-[#E60B18] selection:text-white relative overflow-x-hidden antialiased">
      {/* Dynamic Ambient Background Grid */}
      <div 
        className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"
      />

      {/* Main UI Layout */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <HeroSection />
          <PortfolioSection />
          <AboutSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;