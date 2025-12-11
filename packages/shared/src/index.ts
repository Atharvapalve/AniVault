// Anime Types
export interface Anime {
  id: string;
  title: string;
  titleEnglish?: string;
  titleJapanese?: string;
  description?: string;
  coverImage?: string;
  bannerImage?: string;
  episodes?: number;
  status: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch';
  progress: number;
  rating?: number;
  genres?: string[];
  year?: number;
  season?: 'winter' | 'spring' | 'summer' | 'fall';
  format?: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  autoTrack: boolean;
  syncEnabled: boolean;
  notifications: boolean;
  language: string;
}

// Tracking Events
export interface TrackingEvent {
  id: string;
  animeId: string;
  userId: string;
  type: 'episode_start' | 'episode_complete' | 'anime_start' | 'anime_complete' | 'rating_update' | 'status_change';
  episodeNumber?: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface EpisodeProgress {
  animeId: string;
  episodeNumber: number;
  watched: boolean;
  progress: number; // 0-100
  lastWatchedAt?: Date;
}

// Streaming Platform Types
export type StreamingPlatform = 'crunchyroll' | 'netflix' | 'local' | 'other';

export interface StreamingSession {
  id: string;
  platform: StreamingPlatform;
  animeId?: string;
  episodeNumber?: number;
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, unknown>;
}

export * from './extension';

