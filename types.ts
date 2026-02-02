
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

export interface POI {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    name: string;
    city: string;
  };
  narrativeInsight: string;
  anchoredAssetId?: string;
  displayMode: 'ar' | 'studio' | 'hybrid' | 'text';
  audioUrl?: string;
  videoUrl?: string;
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
  audioUrl?: string;
  videoUrl?: string;
  category: 'Modern' | 'Heritage' | 'Abstract' | 'Interactive' | 'Soundscape';
  isTimedEvent?: boolean;
}

/**
 * Fixed: Added HeritageSite interface
 */
export interface HeritageSite {
  id: string;
  name: string;
  history: string;
  location: { lat: number; lng: number };
}

/**
 * Fixed: Added ExperienceJourney interface
 */
export interface ExperienceJourney {
  id: string;
  theme: string;
  city: string;
  organization: string;
  creator: string;
  points: POI[];
  qrCodeUrl: string;
  createdAt?: string;
  isEvent: boolean;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
}

/**
 * Fixed: Added UserStats interface
 */
export interface UserStats {
  level: number;
  xp: number;
  sitesVisited: number;
  quizzesSolved: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
  }>;
}

/**
 * Fixed: Added QuizQuestion interface
 */
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export type PortalMode = 'visitor' | 'creator' | 'curator';
export type ViewState = 'landing' | 'explore' | 'ar-view' | 'gallery' | 'dashboard' | 'play' | 'journey-landing' | 'exhibitions';
