export interface VfxProject {
  id: string;
  title: string;
  client: string;
  category: 'compositing' | 'cgi' | 'fx' | 'environments';
  categoryLabel: string;
  year: string;
  thumbnail: string;
  videoUrl: string;
  descriptionEn: string;
  descriptionIt: string;
  services: string[];
}

export const PORTFOLIO_PROJECTS: VfxProject[] = [
  {
    id: 'cyber-city-2088',
    title: 'Cyberpunk Metropolis',
    client: 'Warner Bros / Feature Film',
    category: 'environments',
    categoryLabel: '3D Environment',
    year: '2025',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // URL video o Vimeo embed
    descriptionEn: 'Full 3D digital matte painting and CGI environment extension for futuristic city sequence.',
    descriptionIt: 'Matte painting 3D digitale completo ed estensione di ambiente CGI per sequenza futuristica.',
    services: ['3D Modeling', 'Matte Painting', 'Lighting & Rendering'],
  },
  {
    id: 'quantum-glitch',
    title: 'Quantum Anomaly',
    client: 'Netflix Originals',
    category: 'fx',
    categoryLabel: 'FX Simulation',
    year: '2025',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    descriptionEn: 'Complex fluid dynamics and particle disintegration effects for sci-fi climax.',
    descriptionIt: 'Dinamica dei fluidi complessa ed effetti di disintegrazione particellare per il climax sci-fi.',
    services: ['Houdini FX', 'Particle Systems', 'Compositing'],
  },
  {
    id: 'deep-space-odyssey',
    title: 'Void Horizon',
    client: 'Paramount Pictures',
    category: 'cgi',
    categoryLabel: '3D & CGI',
    year: '2024',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    descriptionEn: 'Hard-surface asset modeling and realistic space lighting shaders.',
    descriptionIt: 'Modellazione asset hard-surface e shader per l\'illuminazione spaziale realistica.',
    services: ['Hard-Surface CGI', 'Texture Painting', 'Lookdev'],
  },
  {
    id: 'championship-commercial',
    title: 'Apex Speed',
    client: 'Red Bull Racing',
    category: 'compositing',
    categoryLabel: 'Compositing',
    year: '2024',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    descriptionEn: 'Seamless green screen replacement, CG vehicle integration, and high-octane color grading.',
    descriptionIt: 'Integrazione green screen fluida, veicolo CG e color grading ad alta energia.',
    services: ['Nuke Compositing', 'Chroma Key', 'Matchmoving'],
  },
];