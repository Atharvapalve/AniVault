import type { Anime } from '@anivault/shared'

/**
 * Resolves an absolute episode number to the correct season and relative episode
 * 
 * @param timeline - Array of anime seasons in order [Season 1, Season 2, ...]
 * @param absoluteEpisode - The global episode number (e.g., 14 across all seasons)
 * @returns Object with the matched anime ID, relative episode, and title
 * 
 * Example:
 * - Timeline: [Kaiju S1: 12 eps, Kaiju S2: 11 eps]
 * - Absolute Episode: 14
 * - Returns: { animeId: "S2_ID", episode: 2, title: "Kaiju No. 8 Season 2" }
 */
export function resolveFranchiseEpisode(
  timeline: Anime[],
  absoluteEpisode: number
): { animeId: string; episode: number; title: string } | null {
  console.log('[AniVault] Resolving franchise episode:', {
    absoluteEpisode,
    timelineLength: timeline.length
  })

  if (timeline.length === 0) {
    console.warn('[AniVault] Empty timeline provided')
    return null
  }

  let cumulativeOffset = 0

  // Iterate through timeline (S1 -> S2 -> S3...)
  for (let i = 0; i < timeline.length; i++) {
    const anime = timeline[i]
    const maxEpisodes = (anime as any).episodes as number | undefined || 25 // Fallback for airing shows

    console.log(`[AniVault] Checking ${anime.title}: ${maxEpisodes} episodes, offset: ${cumulativeOffset}`)

    // Check if absoluteEpisode falls within this season's range
    if (absoluteEpisode <= cumulativeOffset + maxEpisodes) {
      const relativeEpisode = absoluteEpisode - cumulativeOffset

      console.log(`[AniVault] ✅ Match found in ${anime.title}:`, {
        absoluteEpisode,
        relativeEpisode,
        seasonIndex: i + 1,
        offset: cumulativeOffset
      })

      return {
        animeId: anime.id,
        episode: relativeEpisode,
        title: anime.title,
      }
    }

    // Not in this season, move to next
    cumulativeOffset += maxEpisodes
  }

  // Fallback: absoluteEpisode exceeds all known seasons
  // Return the last season with the calculated episode
  const lastAnime = timeline[timeline.length - 1]
  const fallbackEpisode = absoluteEpisode - cumulativeOffset + ((lastAnime as any).episodes as number || 0)
  
  console.log(`[AniVault] ⚠️ Episode exceeds timeline, using last season:`, {
    absoluteEpisode,
    fallbackEpisode,
    lastAnime: lastAnime.title
  })

  return {
    animeId: lastAnime.id,
    episode: fallbackEpisode,
    title: lastAnime.title,
  }
}

/**
 * Calculate episode counts for each season in a franchise timeline
 * Returns array of episode counts: [12, 11, 13, ...] for [S1, S2, S3, ...]
 */
export function getEpisodeCountsFromTimeline(timeline: Anime[]): number[] {
  return timeline.map(anime => (anime as any).episodes as number || 25)
}

