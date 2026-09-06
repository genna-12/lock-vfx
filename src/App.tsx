// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LockVfxNavbar } from './components/layout/LockVfxNavbar';
import { LanguageSwitcher } from './components/ui/LanguageSwitcher';
import { CustomCursor } from './components/ui/CustomCursor';
import { HomePage } from './pages/HomePage';
// Altre pagine: Portfolio, About, Contact...

function App() {
  return (
    <Router>
      <div className="bg-[#020202] min-h-screen text-[#F3F4F6] selection:bg-[#E60B18] selection:text-white font-sans antialiased">
        <CustomCursor />
        <LockVfxNavbar />
        <LanguageSwitcher />
        
        <main className="relative z-0">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* <Route path="/portfolio" element={<PortfolioPage />} /> */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;