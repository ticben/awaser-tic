
import { Artwork, HeritageSite } from './types';

export const ARTWORKS: Artwork[] = [
  {
    id: '1',
    title: 'Digital Resilience',
    artist: 'Zahra Al-Mansour',
    description: 'A floating structure representing the blend of tradition and digital future.',
    location: { lat: 24.7136, lng: 46.6753, name: 'King Abdulaziz Historical Center' },
    imageUrl: 'https://picsum.photos/seed/awasser1/800/800',
    category: 'Modern'
  },
  {
    id: '2',
    title: 'Echoes of Diriyah',
    artist: 'Omar Khaled',
    description: 'An interactive AR soundscape visualizing ancient whispers in the mud-brick walls.',
    location: { lat: 24.7333, lng: 46.5414, name: 'Turaif District' },
    imageUrl: 'https://picsum.photos/seed/awasser2/800/800',
    category: 'Soundscape'
  },
  {
    id: '3',
    title: 'Urban Synthesis',
    artist: 'Laila Fahd',
    description: 'Fractal patterns that react to the movement of pedestrians.',
    location: { lat: 24.6333, lng: 46.7167, name: 'Masmak Fort' },
    imageUrl: 'https://picsum.photos/seed/awasser3/800/800',
    category: 'Interactive'
  },
  {
    id: '4',
    title: 'Sonic Loom',
    artist: 'Faisal Jameel',
    description: 'A spatialized audio tapestry that weaves local market field recordings into procedural drones.',
    location: { lat: 24.6300, lng: 46.7100, name: 'Souq Al Zal' },
    imageUrl: 'https://picsum.photos/seed/awasser4/800/800',
    category: 'Soundscape'
  }
];

export const SITES: HeritageSite[] = [
  {
    id: 's1',
    name: 'Masmak Fort',
    history: 'Built around 1865, this clay and mud-brick fort played a major role in the unification of Saudi Arabia.',
    location: { lat: 24.6333, lng: 46.7167 }
  },
  {
    id: 's2',
    name: 'Turaif District',
    history: 'A UNESCO World Heritage site and the original home of the Saudi royal family.',
    location: { lat: 24.7333, lng: 46.5414 }
  }
];
