export interface ExtensionEpisodeEvent {
  platform: string
  title: string
  overallEpisode?: number | null // Crunchyroll global numbering e.g. 14
  seasonNumber?: number | null // 2 (if adapter detected it)
  seasonEpisode?: number | null // may be null if Crunchyroll uses global numbers
  url?: string
  watchedSeconds?: number
  durationSeconds?: number
  progress?: number
  completedAt?: string
}

/**
 * Convert a global/absolute episode number to a season-local episode number
 * using per-season episode counts.
 *
 * @param globalEpisode Global episode number (e.g., 14 for S2E2 when S1 has 12 eps)
 * @param seasonNumber Season index (1-based)
 * @param episodeCountsPerSeason Array of episode counts per season (index 0 = Season 1)
 */
export function convertGlobalToSeasonEpisode(
  globalEpisode: number,
  seasonNumber: number,
  episodeCountsPerSeason: number[]
): number {
  if (!Array.isArray(episodeCountsPerSeason) || episodeCountsPerSeason.length === 0) {
    return Math.max(1, globalEpisode)
  }

  const prevTotal = episodeCountsPerSeason
    .slice(0, Math.max(0, seasonNumber - 1))
    .reduce((a, b) => a + (b || 0), 0)

  let seasonEpisode = globalEpisode - prevTotal
  if (seasonEpisode < 1) seasonEpisode = 1

  const maxInSeason = episodeCountsPerSeason[seasonNumber - 1] ?? seasonEpisode
  if (seasonEpisode > maxInSeason) seasonEpisode = maxInSeason

  return seasonEpisode
}

