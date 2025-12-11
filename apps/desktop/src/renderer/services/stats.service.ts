import type { Anime } from '@anivault/shared'

export const EPISODE_MINUTES = 24

export type WatchSource = 'desktop' | 'extension' | 'manual'

export interface WatchEvent {
  animeId: number
  episode: number
  at: string // ISO timestamp
  source: WatchSource
}

export interface LibraryStats {
  totalEpisodes: number
  totalMinutes: number
  totalHours: number
  totalAnime: number
  genreBreakdown: Array<{ name: string; count: number }>
  scoreDistribution: Array<{ score: number; count: number }>
}

// Heatmap over days (GitHub-style)
export interface HeatmapCell {
  date: string // 'YYYY-MM-DD'
  count: number // episodes watched that day
}

export interface HeatmapData {
  cells: HeatmapCell[]
  maxCount: number // maximum episodes in a single day, used for intensity scaling
}

// Binge sessions and profile
export interface BingeSession {
  date: string // 'YYYY-MM-DD'
  start: string // ISO timestamp of first episode in session
  end: string // ISO timestamp of last episode in session
  episodes: number // episodes in this session
  animeIds: number[] // unique anime IDs in this session
}

export type WatcherArchetype =
  | 'night-owl'
  | 'weekend-marathoner'
  | 'daily-sipper'
  | 'casual'
  | 'unknown'

export interface BingeProfile {
  totalSessions: number
  longestSession: BingeSession | null
  averageEpisodesPerSession: number
  mostEpisodesInADay: number
  archetype: WatcherArchetype
}

// Milestones / achievements
export interface MilestoneProgress {
  id: string
  title: string
  description: string
  current: number
  target: number
  achievedAt?: string // ISO timestamp if completed
}

// Yearly summary / “Wrapped”-style metrics
export interface TopGenreSummary {
  genre: string
  count: number
}

export interface TopAnimeSummary {
  animeId: number
  title: string
  episodes: number
}

export interface YearlySummary {
  year: number
  totalEpisodes: number
  totalHours: number
  animeStarted: number
  animeCompleted: number
  topGenres: TopGenreSummary[]
  topAnime: TopAnimeSummary[]
}

export interface StatsSnapshot {
  libraryStats: LibraryStats
  heatmap: HeatmapData
  bingeProfile: BingeProfile
  milestones: MilestoneProgress[]
  yearlySummary: YearlySummary | null
}

/**
 * Calculate summary statistics for a library.
 * Gracefully handles missing data:
 * - progress falls back to episodes, then 12 if both are missing.
 * - score is clamped to 1–100; missing scores are skipped.
 */
export function calculateLibraryStats(library: Anime[]): LibraryStats {
  let totalEpisodes = 0
  let totalAnime = 0

  const genreCounts = new Map<string, number>()
  const scoreBuckets = new Map<number, number>() // key = bucket start (1, 11, 21, ...)

  for (const anime of library) {
    // Episodes/progress handling
    const progress = safeNumber(anime.progress)
    const episodes = safeNumber((anime as any).episodes) // episodes may not exist on some shapes
    const effectiveEpisodes = progress ?? episodes ?? 12
    totalEpisodes += effectiveEpisodes

    // Completed or watching count
    if (anime.status === 'completed' || anime.status === 'watching') {
      totalAnime += 1
    }

    // Genre aggregation
    const genres = (anime as any).genres as string[] | undefined
    if (Array.isArray(genres)) {
      for (const genre of genres) {
        const name = String(genre)
        genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1)
      }
    }

    // Score distribution (bucketed by 10s: 1–10, 11–20, ..., 91–100)
    // Anime.rating is 0–10; convert to 1–100 scale
    const rating = safeNumber((anime as any).rating)
    if (rating !== null) {
      const normalized = Math.round(rating * 10) // 0–10 -> 0–100
      const clamped = Math.min(Math.max(normalized, 1), 100)
      const bucketStart = Math.floor((clamped - 1) / 10) * 10 + 1 // 1,11,21...
      scoreBuckets.set(bucketStart, (scoreBuckets.get(bucketStart) ?? 0) + 1)
    }
  }

  // Top 5 genres
  const genreBreakdown = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // Score distribution sorted by bucket start
  const scoreDistribution = Array.from(scoreBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([score, count]) => ({ score, count }))

  const totalMinutes = totalEpisodes * EPISODE_MINUTES

  return {
    totalEpisodes,
    totalMinutes,
    totalHours: totalMinutes / 60, // derived hours (24 min per ep -> hours)
    totalAnime,
    genreBreakdown,
    scoreDistribution,
  }
}

// --- Analytics helpers ---

export function buildHeatmapData(events: WatchEvent[]): HeatmapData {
  if (!events.length) return { cells: [], maxCount: 0 }
  const grouped = new Map<string, number>()
  for (const ev of events) {
    const date = formatDate(ev.at)
    grouped.set(date, (grouped.get(date) ?? 0) + 1)
  }
  const cells: HeatmapCell[] = Array.from(grouped.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const maxCount = cells.reduce((max, cell) => Math.max(max, cell.count), 0)
  return { cells, maxCount }
}

export function buildBingeProfile(events: WatchEvent[]): BingeProfile {
  if (!events.length) {
    return {
      totalSessions: 0,
      longestSession: null,
      averageEpisodesPerSession: 0,
      mostEpisodesInADay: 0,
      archetype: 'unknown',
    }
  }

  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at))
  const sessions: BingeSession[] = []
  const gapMinutes = 45

  let current: BingeSession | null = null

  const pushCurrent = () => {
    if (current) {
      current.animeIds = Array.from(new Set(current.animeIds))
      sessions.push(current)
    }
  }

  for (const ev of sorted) {
    if (!current) {
      current = {
        date: formatDate(ev.at),
        start: ev.at,
        end: ev.at,
        episodes: 1,
        animeIds: [ev.animeId],
      }
      continue
    }

    const gap = minutesBetween(current.end, ev.at)
    if (gap <= gapMinutes) {
      current.end = ev.at
      current.episodes += 1
      current.animeIds.push(ev.animeId)
    } else {
      pushCurrent()
      current = {
        date: formatDate(ev.at),
        start: ev.at,
        end: ev.at,
        episodes: 1,
        animeIds: [ev.animeId],
      }
    }
  }
  pushCurrent()

  const totalSessions = sessions.length
  const longestSession =
    sessions.reduce<BingeSession | null>((acc, s) => (acc && acc.episodes >= s.episodes ? acc : s), null) || null
  const totalEpisodesInSessions = sessions.reduce((sum, s) => sum + s.episodes, 0)
  const averageEpisodesPerSession = totalSessions > 0 ? totalEpisodesInSessions / totalSessions : 0

  const episodesPerDay = new Map<string, number>()
  for (const s of sessions) {
    episodesPerDay.set(s.date, (episodesPerDay.get(s.date) ?? 0) + s.episodes)
  }
  const mostEpisodesInADay = Array.from(episodesPerDay.values()).reduce((m, v) => Math.max(m, v), 0)

  const archetype = inferArchetypeSimple(sessions, episodesPerDay, mostEpisodesInADay)

  return {
    totalSessions,
    longestSession,
    averageEpisodesPerSession,
    mostEpisodesInADay,
    archetype,
  }
}

export function buildMilestones(library: Anime[], events: WatchEvent[]): MilestoneProgress[] {
  const totalEpisodes = events.length
  const completedCount = library.filter((a) => a.status === 'completed').length

  // TODO: when rewatch tracking is available, replace current with actual rewatch counts
  const rewatchCount = 0

  const lateNightCount = events.filter((ev) => {
    const hour = new Date(ev.at).getHours()
    return hour >= 0 && hour < 3
  }).length

  const milestones: MilestoneProgress[] = [
    {
      id: 'episodes_100',
      title: '100 Episodes Watched',
      description: 'Reach 100 watched episodes',
      target: 100,
      current: Math.min(totalEpisodes, 100),
      achievedAt: undefined, // could compute exact timestamp later
    },
    {
      id: 'anime_completed_10',
      title: '10 Anime Completed',
      description: 'Complete 10 anime',
      target: 10,
      current: Math.min(completedCount, 10),
      achievedAt: undefined,
    },
    {
      id: 'rewatches_3',
      title: '3 Anime Rewatched',
      description: 'Rewatch 3 anime',
      target: 3,
      current: Math.min(rewatchCount, 3),
      achievedAt: undefined,
    },
    {
      id: 'late_night_50',
      title: '50 Late Night Episodes',
      description: 'Watch 50 episodes between 00:00–03:00',
      target: 50,
      current: Math.min(lateNightCount, 50),
      achievedAt: undefined,
    },
  ]

  // If we want to compute achievedAt for episodes_100 now:
  const epMilestone = milestones.find((m) => m.id === 'episodes_100')
  if (epMilestone && totalEpisodes >= epMilestone.target) {
    epMilestone.achievedAt = findAchievementDate(events, epMilestone.target)
  }

  return milestones
}

export function buildYearlySummary(
  library: Anime[],
  events: WatchEvent[],
  year: number = new Date().getFullYear()
): YearlySummary | null {
  const filtered = events.filter((ev) => ev.at.startsWith(`${year}-`))
  if (filtered.length === 0) return null

  const totalEpisodes = filtered.length
  const totalHours = (totalEpisodes * EPISODE_MINUTES) / 60

  // animeStarted: first event in that year
  const firstEventByAnime = new Map<number, string>()
  for (const ev of filtered) {
    if (!firstEventByAnime.has(ev.animeId)) {
      firstEventByAnime.set(ev.animeId, ev.at)
    }
  }
  const animeStarted = firstEventByAnime.size

  // animeCompleted approximation
  const animeCompleted = library.filter((a) => {
    if (a.status !== 'completed') return false
    // If completedAt exists, use it; else approximate using progress == episodes and at least one event in the year
    const completedAt = (a as any).completedAt as string | undefined
    if (completedAt) {
      return completedAt.startsWith(`${year}-`)
    }
    const episodes = safeNumber((a as any).episodes)
    const progress = safeNumber((a as any).progress)
    const hasEventInYear = filtered.some((ev) => ev.animeId === Number(a.id) || ev.animeId === (a as any).id)
    if (!hasEventInYear) return false
    if (episodes !== null && progress !== null) {
      return progress >= episodes
    }
    return false
  }).length

  // Top genres based on events' anime
  const animeById = new Map<number | string, Anime>()
  for (const a of library) {
    animeById.set(a.id as any, a)
    animeById.set(Number(a.id), a)
  }

  const genreCounts = new Map<string, number>()
  const eventsPerAnime = new Map<number, number>()

  for (const ev of filtered) {
    const anime = animeById.get(ev.animeId) || animeById.get(String(ev.animeId))
    if (anime) {
      const genres = (anime as any).genres as string[] | undefined
      if (Array.isArray(genres)) {
        for (const g of genres) {
          genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
        }
      }
    }
    eventsPerAnime.set(ev.animeId, (eventsPerAnime.get(ev.animeId) ?? 0) + 1)
  }

  const topGenres: TopGenreSummary[] = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre, count]) => ({ genre, count }))

  const topAnime: TopAnimeSummary[] = Array.from(eventsPerAnime.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([animeId, episodes]) => {
      const anime = animeById.get(animeId) || animeById.get(String(animeId))
      return {
        animeId,
        title: anime?.title ?? 'Unknown',
        episodes,
      }
    })

  return {
    year,
    totalEpisodes,
    totalHours,
    animeStarted,
    animeCompleted,
    topGenres,
    topAnime,
  }
}

export function buildStatsSnapshot(library: Anime[], events: WatchEvent[]): StatsSnapshot {
  const libraryStats = calculateLibraryStats(library)
  const heatmap = buildHeatmapData(events)
  const bingeProfile = buildBingeProfile(events)
  const milestones = buildMilestones(library, events)
  const currentYear = new Date().getFullYear()
  const yearlySummary = buildYearlySummary(library, events, currentYear)

  return {
    libraryStats,
    heatmap,
    bingeProfile,
    milestones,
    yearlySummary,
  }
}

function safeNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  return null
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10) // YYYY-MM-DD
}

function minutesBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  return Math.max(0, (end - start) / (1000 * 60))
}

function inferArchetype(sessions: BingeSession[], avgEpisodes: number, mostInDay: number): WatcherArchetype {
  if (!sessions.length) return 'unknown'

  const eveningSessions = sessions.filter((s) => {
    const hour = new Date(s.start).getHours()
    return hour >= 21 || hour < 3
  }).length

  const weekendSessions = sessions.filter((s) => {
    const d = new Date(s.start).getDay()
    return d === 0 || d === 6
  }).length

  const total = sessions.length
  const eveningShare = eveningSessions / total
  const weekendShare = weekendSessions / total

  if (eveningShare >= 0.6 && mostInDay >= 3) return 'night-owl'
  if (weekendShare >= 0.6 && mostInDay >= 4) return 'weekend-marathoner'
  if (avgEpisodes <= 2 && total >= 5) return 'daily-sipper'
  if (avgEpisodes <= 2 && total < 5) return 'casual'

  return 'unknown'
}

// Simple archetype using sessions + episodes-per-day map
function inferArchetypeSimple(
  sessions: BingeSession[],
  episodesPerDay: Map<string, number>,
  mostEpisodesInADay: number
): WatcherArchetype {
  const totalSessions = sessions.length
  if (totalSessions === 0) return 'unknown'

  const eveningSessions = sessions.filter((s) => {
    const hour = new Date(s.start).getHours()
    return hour >= 21 || hour < 3
  }).length

  const weekendSessions = sessions.filter((s) => {
    const d = new Date(s.start).getDay()
    return d === 0 || d === 6
  }).length

  const eveningShare = eveningSessions / totalSessions
  const weekendShare = weekendSessions / totalSessions

  const totalEpisodes = Array.from(episodesPerDay.values()).reduce((sum, n) => sum + n, 0)
  const avgPerSession = totalEpisodes > 0 ? totalEpisodes / totalSessions : 0

  if (eveningShare >= 0.6 && mostEpisodesInADay >= 3) return 'night-owl'
  if (weekendShare >= 0.6 && mostEpisodesInADay >= 4) return 'weekend-marathoner'
  if (avgPerSession <= 2 && totalSessions >= 5) return 'daily-sipper'
  if (avgPerSession <= 2 && totalSessions < 5) return 'casual'

  return 'unknown'
}

function findAchievementDate(events: WatchEvent[], target: number): string | undefined {
  if (target <= 0) return undefined
  let count = 0
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at))
  for (const ev of sorted) {
    count += 1
    if (count >= target) return ev.at
  }
  return undefined
}

