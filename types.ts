
export type Language = 'ar' | 'en';

export interface MediaAsset {
  id: string;
  type: 'photo' | 'video' | 'archive' | 'audio' | 'model';
  title: string;
  url: string;
  description?: string;
  status: 'syncing' | 'live' | 'error' | 'optimizing';
  sizeInMb: number;
  createdAt: string;
}

export interface TimedEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  curator: string;
  artworkIds: string[];
  bannerUrl: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface UserStats {
  level: number;
  xp: number;
  sitesVisited: number;
  quizzesSolved: number;
  badges: Badge[];
}

export interface POI {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  narrativeInsight: string;
}

export interface ExperienceJourney {
  id: string;
  theme: string;
  creator: string;
  points: POI[];
  qrCodeUrl: string;
  createdAt: string;
  isEvent?: boolean;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
}

export interface HeritageSite {
  id: string;
  name: string;
  history: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  imageUrl: string;
  modelUrl?: string;
  category: 'Modern' | 'Heritage' | 'Abstract' | 'Interactive' | 'Soundscape';
  isTimedEvent?: boolean;
}

export type PortalMode = 'visitor' | 'creator' | 'curator';
export type ViewState = 'landing' | 'explore' | 'ar-view' | 'gallery' | 'dashboard' | 'play' | 'journey-landing' | 'exhibitions';
