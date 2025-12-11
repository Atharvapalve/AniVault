// Extension-specific types

export type Platform = 'crunchyroll' | 'netflix' | 'zoro' | 'nineanime' | 'animepahe' | 'generic'

export interface EpisodeInfo {
  platform: Platform
  title: string // e.g. "SPY×FAMILY Season 2"
  overallEpisode: number | null // e.g. 38 (if known)
  seasonNumber: number | null // e.g. 2 (if known)
  seasonEpisode: number | null // e.g. 23 (if known)
  url: string
}

// Legacy type for backward compatibility
export interface EpisodeDetection extends EpisodeInfo {
  episode: number | null // Maps to overallEpisode or seasonEpisode
  season?: number | null // Maps to seasonNumber
}

export interface ExtensionEpisodeEvent {
  platform: Platform
  title: string // e.g. "SPY×FAMILY Season 2"
  overallEpisode: number | null // e.g. 38 (if known)
  seasonNumber: number | null // e.g. 2 (if known)
  seasonEpisode: number | null // e.g. 23 (if known)
  url: string
  watchedSeconds: number
  durationSeconds: number
  progress: number // 0-1
  completedAt: string // ISO timestamp
}

export interface EpisodeCompleteEvent {
  type: 'ANIVault_EPISODE_COMPLETE'
  data: ExtensionEpisodeEvent
}

export interface LastWatchedEntry {
  platform: Platform
  title: string
  episode: number | null
  season?: number | null
  url: string
  completedAt: string
}

export interface ExtensionSettings {
  autoTrack: boolean
  lastSeenVersion: string
}

export interface ExtensionStorage {
  settings: ExtensionSettings
  lastWatched: LastWatchedEntry[]
  pendingSync?: EpisodeCompleteEvent['data'][]
}

export interface PlaybackState {
  lastProgress: number
  hasSentComplete: boolean
  lastEpisodeKey: string | null // "title-episode-season" for deduplication
}

// Desktop app communication
export const DESKTOP_APP_PORT = 35847
export const DESKTOP_APP_ENDPOINT = `/extension-event`
export const DESKTOP_APP_URL = `http://127.0.0.1:${DESKTOP_APP_PORT}${DESKTOP_APP_ENDPOINT}`
export const DESKTOP_APP_CLEAR_URL = `http://127.0.0.1:${DESKTOP_APP_PORT}${DESKTOP_APP_ENDPOINT}/clear`

