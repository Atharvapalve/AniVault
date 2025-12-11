import type { Anime } from '@anivault/shared'
import { anilistService } from './anilist.service'

export type MoodId =
  | 'hype'
  | 'chill'
  | 'emotional'
  | 'dark'
  | 'comedy'
  | 'romcom'
  | 'mind_bend'
  | 'wholesome'

export interface MoodDefinition {
  id: MoodId
  label: string
  description: string
  emoji: string
  includeTags: string[]
  excludeTags?: string[]
  minScore?: number
  sortBy?: 'score' | 'popularity' | 'trending'
  maxEpisodesHint?: number
}

export interface MoodRecommendation {
  mood: MoodDefinition
  anime: Anime[]
}

export interface MoodRecommendationOptions {
  limit?: number
  excludeCompleted?: boolean
  excludeDropped?: boolean
}

export const MOODS: MoodDefinition[] = [
  {
    id: 'hype',
    label: 'Hype Mode',
    description: 'High energy, big stakes, pure adrenaline.',
    emoji: '🔥',
    includeTags: ['Shounen', 'Action', 'Battle', 'Super Power', 'Tournament'],
    excludeTags: [],
    minScore: 70,
    sortBy: 'trending',
  },
  {
    id: 'chill',
    label: 'Chill',
    description: 'Cozy slice-of-life and iyashikei vibes.',
    emoji: '😌',
    includeTags: ['Slice of Life', 'Iyashikei', 'Relaxing', 'Healing', 'CGDCT'],
    excludeTags: ['Horror', 'Gore'],
    sortBy: 'score',
    maxEpisodesHint: 26,
  },
  {
    id: 'emotional',
    label: 'Emotional',
    description: 'Heartfelt drama and romance that hit hard.',
    emoji: '😭',
    includeTags: ['Drama', 'Romance', 'Tragedy', 'Sad'],
    excludeTags: ['Parody'],
    minScore: 72,
    sortBy: 'score',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Psychological, horror, and thriller twists.',
    emoji: '🖤',
    includeTags: ['Psychological', 'Horror', 'Thriller', 'Seinen', 'Dark Fantasy'],
    excludeTags: ['Iyashikei', 'CGDCT'],
    minScore: 70,
    sortBy: 'score',
  },
  {
    id: 'comedy',
    label: 'Comedy',
    description: 'Parody, gags, and laugh-out-loud moments.',
    emoji: '😂',
    includeTags: ['Comedy', 'Parody', 'Gag Humor', 'Slapstick'],
    excludeTags: ['Horror'],
    sortBy: 'popularity',
  },
  {
    id: 'romcom',
    label: 'Rom-Com',
    description: 'Romance with a side of comedy.',
    emoji: '💕',
    includeTags: ['Romance', 'Comedy', 'Romantic Comedy', 'School'],
    excludeTags: ['Horror'],
    sortBy: 'score',
  },
  {
    id: 'mind_bend',
    label: 'Mind-Bend',
    description: 'Psychological, mystery, time-twisting stories.',
    emoji: '🌀',
    includeTags: ['Psychological', 'Mystery', 'Supernatural', 'Time Travel'],
    excludeTags: ['Parody'],
    minScore: 72,
    sortBy: 'score',
  },
  {
    id: 'wholesome',
    label: 'Wholesome',
    description: 'Family-friendly, cute, heartwarming shows.',
    emoji: '🌸',
    includeTags: ['Slice of Life', 'Family', 'CGDCT', 'Iyashikei', 'Friendship'],
    excludeTags: ['Horror', 'Ecchi', 'Gore'],
    sortBy: 'score',
    maxEpisodesHint: 24,
  },
]

export const AVAILABLE_MOODS = MOODS

export function getMoodById(id: MoodId): MoodDefinition | undefined {
  return MOODS.find((m) => m.id === id)
}

/**
 * Compute mood-based recommendations using only client-side data and AniList API.
 * Steps:
 * 1) Pull a diversified candidate pool (trending/popular/score).
 * 2) Score candidates against the chosen mood using tags/genres/score/length.
 * 3) Filter out completed/dropped entries from the user's library.
 * 4) Sort by moodScore and the mood's preferred tie-breaker.
 */
export async function getMoodRecommendations(
  moodId: MoodId,
  library: Anime[],
  options: MoodRecommendationOptions = {}
): Promise<MoodRecommendation> {
  const mood = getMoodById(moodId)
  if (!mood) {
    throw new Error(`Mood not found: ${moodId}`)
  }

  const { limit = 12, excludeCompleted = true, excludeDropped = true } = options

  // Build quick lookup for library statuses to filter out completed/dropped entries.
  const libraryStatusById = new Map<string, string>()
  for (const item of library || []) {
    if (item?.id) {
      libraryStatusById.set(item.id, (item as any).status || '')
    }
  }

  const pool = await anilistService.getRecommendationPool()

  const scored = pool
    .map((anime) => {
      const tags = ((anime as any).tags as string[] | undefined) || []
      const genres = ((anime as any).genres as string[] | undefined) || anime.genres || []
      const avgScore = (anime as any).averageScore as number | undefined
      const episodes = (anime as any).episodes as number | undefined
      const status = (anime as any).status as string | undefined
      const popularity = (anime as any).popularity as number | undefined
      const trending = (anime as any).trending as number | undefined

      // Library-based filters
      const libraryStatus = libraryStatusById.get(anime.id)
      if (excludeCompleted && libraryStatus === 'completed') return null
      if (excludeDropped && libraryStatus === 'dropped') return null

      let moodScore = 0

      // Matching tags/keywords (AniList tags)
      const tagMatches = tags.filter((t) => mood.includeTags.includes(t))
      moodScore += tagMatches.length * 15

      // Matching genres (weaker weight)
      const genreMatches = genres.filter((g) => mood.includeTags.includes(g))
      moodScore += genreMatches.length * 8

      // Apply minimum score preference
      if (mood.minScore && typeof avgScore === 'number' && avgScore >= mood.minScore) {
        moodScore += 10
      }

      // Exclusions hard-block
      const exclusions = mood.excludeTags || []
      const hasExcluded = exclusions.some((ex) => tags.includes(ex) || genres.includes(ex))
      if (hasExcluded) {
        moodScore = Number.NEGATIVE_INFINITY
      }

      // Prefer shorter runs for certain moods
      if (mood.maxEpisodesHint && episodes && episodes <= mood.maxEpisodesHint) {
        moodScore += 5
      }

      // Slight bonus for finished shows (better binge) for certain moods
      if (status === 'FINISHED' && (mood.id === 'emotional' || mood.id === 'mind_bend' || mood.id === 'chill')) {
        moodScore += 3
      }

      return {
        anime,
        moodScore,
        avgScore: typeof avgScore === 'number' ? avgScore : -1,
        popularity: typeof popularity === 'number' ? popularity : -1,
        trending: typeof trending === 'number' ? trending : -1,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry) && entry.moodScore !== Number.NEGATIVE_INFINITY)

  // Sort by moodScore first, then tie-breaker
  scored.sort((a, b) => {
    if (b.moodScore !== a.moodScore) return b.moodScore - a.moodScore

    switch (mood.sortBy) {
      case 'score':
        return (b.avgScore ?? -1) - (a.avgScore ?? -1)
      case 'popularity':
        return (b.popularity ?? -1) - (a.popularity ?? -1)
      case 'trending':
      default:
        return (b.trending ?? -1) - (a.trending ?? -1)
    }
  })

  const top = scored
    .filter((entry) => Number.isFinite(entry.moodScore))
    .slice(0, limit)
    .map((entry) => entry.anime)

  return {
    mood,
    anime: top,
  }
}

