export interface TechItem {
  id: string;
  name: string;
  category: string;
}

export interface ClientItem {
  id: string;
  name: string;
  roleOrCategory: string;
}

// BASTA AGGIUNGERE VOCILE A QUESTA LISTA PER VEDERLE IN AUTOMATICO NEL SITO
export class TechData {
  static readonly items: TechItem[] = [
    { id: '1', name: 'Foundry Nuke Studio', category: 'Compositing & Keying' },
    { id: '2', name: 'SideFX Houdini', category: 'Procedural FX & Sim' },
    { id: '3', name: 'Autodesk Maya', category: '3D & Animation' },
    { id: '4', name: 'Unreal Engine 5', category: 'Real-Time Production' },
    { id: '5', name: 'DaVinci Resolve', category: 'Color Grading & ACES' },
    { id: '6', name: 'ZBrush', category: 'Digital Sculpting' },
    { id: '7', name: 'PFTrack', category: 'Camera Matchmoving' },
    { id: '8', name: 'Substance 3D Painter', category: 'Texturing & Lookdev' },
  ];
}

export class ClientData {
  static readonly items: ClientItem[] = [
    { id: 'c1', name: 'Warner Bros. Pictures', roleOrCategory: 'Feature Film' },
    { id: 'c2', name: 'Netflix', roleOrCategory: 'Original Series' },
    { id: 'c3', name: 'Paramount', roleOrCategory: 'VFX Production' },
    { id: 'c4', name: 'Red Bull Media', roleOrCategory: 'Commercial' },
    { id: 'c5', name: 'Universal Studios', roleOrCategory: 'Visual Effects' },
    { id: 'c6', name: 'Sony Music', roleOrCategory: 'Music Videos' },
  ];
}