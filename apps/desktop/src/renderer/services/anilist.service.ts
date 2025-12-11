import type { Anime } from '@anivault/shared'

const ANILIST_API_URL = 'https://graphql.anilist.co'

interface AniListMedia {
  id: number
  title: {
    romaji: string
    english?: string
    native?: string
  }
  coverImage: {
    large: string
    medium: string
  }
  bannerImage?: string
  description?: string
  episodes?: number
  status?: string
  genres?: string[]
  tags?: { name: string }[]
  popularity?: number
  trending?: number
  startDate?: {
    year?: number
    month?: number
    day?: number
  }
  format?: string
  averageScore?: number
}

interface AniListResponse {
  data: {
    Page: {
      pageInfo?: {
        total: number
        perPage: number
        currentPage: number
        lastPage: number
        hasNextPage: boolean
      }
      media: AniListMedia[]
    }
  }
}

interface AniListUserResponse {
  data: {
    Viewer: {
      id: number
      name: string
      avatar?: {
        large: string
      }
      options?: {
        profileColor?: string
      }
    }
  }
}

// Cache entry with timestamp
interface CacheEntry<T> {
  data: T
  timestamp: number
}

export class AniListService {
  private accessToken: string | null = null
  // Request cache (5 minute TTL)
  private cache = new Map<string, CacheEntry<any>>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  // Request throttling - track last request time per endpoint
  private lastRequestTime = new Map<string, number>()
  private readonly MIN_REQUEST_INTERVAL = 1000 // 1 second between requests to same endpoint
  // Pending requests to avoid duplicate concurrent requests
  private pendingRequests = new Map<string, Promise<any>>()

  private isRateLimitError(error: any): boolean {
    if (!error) return false
    if (error.message && typeof error.message === 'string' && error.message.includes('Rate limit')) return true
    if (typeof error === 'object' && 'status' in error && (error as any).status === 429) return true
    return false
  }

  private isFetchFailed(error: any): boolean {
    if (!error) return false
    if (error instanceof TypeError && error.message === 'Failed to fetch') return true
    if (typeof error.message === 'string' && error.message.toLowerCase().includes('fetch failed')) return true
    return false
  }

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null
  }

  /**
   * Fetch a diversified recommendation pool for mood-based suggestions.
   * Combines trending, popularity, and score-based lists and de-duplicates.
   */
  async getRecommendationPool(): Promise<Anime[]> {
    const fetchPool = async (sort: 'TRENDING_DESC' | 'POPULARITY_DESC' | 'SCORE_DESC', perPage: number) => {
      const query = `
        query GetRecommendationPool($perPage: Int) {
          Page(perPage: $perPage) {
            media(type: ANIME, sort: ${sort}) {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                medium
              }
              bannerImage
              description
              episodes
              status
              genres
              tags {
                name
              }
              popularity
              trending
              averageScore
              startDate {
                year
                month
                day
              }
              format
            }
          }
        }
      `

      const response = await this.graphqlRequest<AniListResponse>(query, { perPage })
      return response.data.Page.media
    }

    try {
      // Smaller, sequential pulls to ease AniList rate limits.
      const trending = await fetchPool('TRENDING_DESC', 30).catch((err) => {
        if (this.isRateLimitError(err) || this.isFetchFailed(err)) return []
        throw err
      })
      const popular = await fetchPool('POPULARITY_DESC', 50).catch((err) => {
        if (this.isRateLimitError(err) || this.isFetchFailed(err)) return []
        throw err
      })
      const scored = await fetchPool('SCORE_DESC', 50).catch((err) => {
        if (this.isRateLimitError(err) || this.isFetchFailed(err)) return []
        throw err
      })

      const merged = [...trending, ...popular, ...scored]
      const seen = new Set<number>()
      const unique = merged.filter((m) => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })

      return unique.map((media) => this.mapAniListMediaToAnime(media))
    } catch (error) {
      if (this.isFetchFailed(error)) {
        console.warn('Network error fetching recommendation pool; returning empty pool.')
        return []
      }
      if (this.isRateLimitError(error)) {
        console.warn('Rate limited on recommendation pool; returning empty pool.')
        return []
      }
      console.error('Error fetching recommendation pool:', error)
      throw error
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token
    // Clear cache when token changes to avoid serving stale data
    this.cache.clear()
  }

  /**
   * Creates a cache key from query and variables
   */
  private getCacheKey(query: string, variables?: Record<string, unknown>): string {
    return `${query}:${JSON.stringify(variables || {})}`
  }

  /**
   * Checks if cached data is still valid
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Stores data in cache
   */
  private setCached<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Throttles requests to prevent rate limiting
   */
  private async throttleRequest(endpointKey: string): Promise<void> {
    const lastTime = this.lastRequestTime.get(endpointKey) || 0
    const now = Date.now()
    const timeSinceLastRequest = now - lastTime

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime.set(endpointKey, Date.now())
  }

  /**
   * Retries a failed request with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) break

        // Don't retry if it's not a network error
        if (!(error instanceof TypeError && error.message === 'Failed to fetch')) {
          throw error
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  private async graphqlRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const cacheKey = this.getCacheKey(query, variables)
    const endpointKey = query.substring(0, 50) // Use first 50 chars as endpoint identifier

    // Check cache first
    const cached = this.getCached<T>(cacheKey)
    if (cached) {
      return cached
    }

    // Check if there's already a pending request for this query
    const pending = this.pendingRequests.get(cacheKey)
    if (pending) {
      return pending
    }

    // Throttle requests to prevent rate limiting
    await this.throttleRequest(endpointKey)

    // Create the request promise
    const requestPromise = this.retryWithBackoff(async () => {
      // If running in Electron, try IPC proxy to bypass CORS
      const electronApi = (globalThis as any)?.electron
      if (electronApi?.anilist?.graphql) {
        return electronApi.anilist.graphql({
          query,
          variables,
          accessToken: this.accessToken,
        }) as Promise<T>
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
      }

      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error('AniList API Error Body:', errorBody)
        
        // Handle rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.')
        }
        
        throw new Error(`AniList API error (${response.status}): ${errorBody}`)
      }

      const data = await response.json()

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      return data as T
    }).then((data) => {
      // Cache successful response
      this.setCached(cacheKey, data)
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey)
      return data
    }).catch((error) => {
      // Remove from pending requests on error
      this.pendingRequests.delete(cacheKey)
      throw error
    })

    // Store pending request
    this.pendingRequests.set(cacheKey, requestPromise)

    try {
      return await requestPromise
    } catch (error) {
      // Enhanced error handling for network issues
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error: Failed to fetch from AniList API. This could be due to:')
        console.error('1. Network connectivity issues')
        console.error('2. Rate limiting (too many requests)')
        console.error('3. CORS restrictions (unlikely for AniList)')
        throw new Error('Network error: Unable to connect to AniList API. Please check your internet connection or wait a moment and try again.')
      }
      throw error
    }
  }

  /**
   * Fetches trending anime from AniList
   */
  async getTrendingAnime(perPage: number = 10): Promise<Anime[]> {
    const query = `
      query GetTrendingAnime($perPage: Int) {
        Page(perPage: $perPage) {
          media(type: ANIME, sort: TRENDING_DESC, status: RELEASING) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            bannerImage
            description
            episodes
            status
            genres
            tags {
              name
            }
            popularity
            trending
            startDate {
              year
              month
              day
            }
            format
            averageScore
          }
        }
      }
    `

    try {
      const response = await this.graphqlRequest<AniListResponse>(query, { perPage })
      const mediaList = response.data.Page.media

      return mediaList.map((media) => this.mapAniListMediaToAnime(media))
    } catch (error) {
      if (this.isFetchFailed(error)) {
        console.warn('Network error fetching trending; returning empty list.')
        return []
      }
      if (this.isRateLimitError(error)) {
        console.warn('Rate limited on trending; returning empty list.')
        return []
      }
      console.error('Error fetching trending anime:', error)
      throw error
    }
  }

  /**
   * Updates the progress for an anime
   */
  async updateProgress(
    mediaId: number,
    progress: number,
    status?: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'PAUSED' | 'DROPPED',
    episodeNumber?: number
  ): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Authentication required to update progress')
    }

    const mutation = `
      mutation UpdateProgress($mediaId: Int!, $progress: Int!, $status: MediaListStatus, $episode: Int) {
        SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status, episode: $episode) {
          id
          progress
          status
        }
      }
    `

    try {
      await this.graphqlRequest(mutation, {
        mediaId,
        progress,
        status: status || 'PLANNING',
        episode: episodeNumber,
      })
      return true
    } catch (error) {
      console.error('Error updating progress:', error)
      throw error
    }
  }

  /**
   * Fetches top rated anime from AniList
   */
  async getTopRatedAnime(perPage: number = 10): Promise<Anime[]> {
    const query = `
      query GetTopRatedAnime($perPage: Int) {
        Page(perPage: $perPage) {
          media(type: ANIME, sort: SCORE_DESC) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            bannerImage
            description
            episodes
            status
            genres
            tags {
              name
            }
            popularity
            trending
            startDate {
              year
              month
              day
            }
            format
            averageScore
          }
        }
      }
    `

    try {
      const response = await this.graphqlRequest<AniListResponse>(query, { perPage })
      const mediaList = response.data.Page.media

      return mediaList.map((media) => this.mapAniListMediaToAnime(media))
    } catch (error) {
      if (this.isFetchFailed(error)) {
        console.warn('Network error fetching top rated; returning empty list.')
        return []
      }
      if (this.isRateLimitError(error)) {
        console.warn('Rate limited on top rated; returning empty list.')
        return []
      }
      console.error('Error fetching top rated anime:', error)
      throw error
    }
  }

  /**
   * Searches for anime with proper pagination and server-side filtering
   */
  async searchAnime(
    query: string, 
    filters: { 
      genre?: string | null, 
      year?: string | null, 
      sort?: string 
    }, 
    page: number = 1, 
    perPage: number = 20
  ): Promise<Anime[]> {
    // We added $page, $year (seasonYear), and $sort to the query
    const queryString = `
      query SearchAnime($search: String, $genres: [String], $page: Int, $perPage: Int, $year: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          media(type: ANIME, search: $search, genre_in: $genres, seasonYear: $year, sort: $sort) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            bannerImage
            description
            episodes
            status
            genres
            startDate {
              year
              month
              day
            }
            format
            averageScore
          }
        }
      }
    `

    try {
      // Construct variables dynamically
      const variables: Record<string, any> = {
        page,
        perPage,
        sort: filters.sort || 'POPULARITY_DESC', // Default sort
      }

      // Only add search if user typed something (empty string returns weird results sometimes)
      if (query && query.trim().length > 0) {
        variables.search = query
      }

      if (filters.genre) {
        variables.genres = [filters.genre]
      }

      // Send the year to the server!
      if (filters.year) {
        variables.year = parseInt(filters.year)
      }

      const response = await this.graphqlRequest<AniListResponse>(queryString, variables)
      const mediaList = response.data.Page.media

      return mediaList.map((media) => this.mapAniListMediaToAnime(media))
    } catch (error) {
      console.error('Error searching anime:', error)
      throw error
    }
  }

  /**
   * Gets the current user's profile
   */
  async getCurrentUser() {
    if (!this.accessToken) {
      throw new Error('Authentication required')
    }

    const query = `
      query GetCurrentUser {
        Viewer {
          id
          name
          avatar {
            large
          }
          options {
            profileColor
          }
        }
      }
    `

    try {
      const response = await this.graphqlRequest<AniListUserResponse>(query)
      return response.data.Viewer
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  /**
   * Fetches the user's entire library (Watch List)
   */
  async getUserLibrary(userId: number): Promise<Anime[]> {
    const query = `
      query GetUserLibrary($userId: Int) {
        MediaListCollection(userId: $userId, type: ANIME) {
          lists {
            entries {
              status
              progress
              score
              media {
                id
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  large
                  medium
                }
                bannerImage
                description
                episodes
                genres
                startDate {
                  year
                }
                format
                averageScore
              }
            }
          }
        }
      }
    `

    try {
      const response = await this.graphqlRequest<any>(query, { userId })
      const lists = response.data.MediaListCollection?.lists || []

      let allAnime: Anime[] = []

      for (const list of lists) {
        const mappedEntries = list.entries.map((entry: any) => {
          const anime = this.mapAniListMediaToAnime(entry.media)
          
          // 1. Force the progress from the User's List (not the generic anime data)
          anime.progress = entry.progress || 0
          
          // 2. Map AniList Rating
          if (entry.score) {
            anime.rating = entry.score
          }

          // 3. STRICT 4 CATEGORY MAPPING (No "on-hold" category)
          // Maps AniList's "PAUSED" to "plan-to-watch" to avoid a 5th category
          const statusMap: Record<string, 'watching' | 'plan-to-watch' | 'completed' | 'dropped'> = {
            'CURRENT': 'watching',
            'REPEATING': 'watching',
            'COMPLETED': 'completed',
            'DROPPED': 'dropped',
            'PLANNING': 'plan-to-watch',
            'PAUSED': 'plan-to-watch' // Force "Paused" into "Planning" to avoid 5th category
          }
          
          anime.status = statusMap[entry.status] || 'plan-to-watch'
          
          return anime
        })
        allAnime = [...allAnime, ...mappedEntries]
      }

      return allAnime
    } catch (error) {
      console.error('Error fetching user library:', error)
      return []
    }
  }

  private mapAniListMediaToAnime(media: AniListMedia): Anime {
    return {
      id: media.id.toString(),
      title: media.title.romaji,
      titleEnglish: media.title.english || undefined,
      titleJapanese: media.title.native || undefined,
      description: media.description || undefined,
      coverImage: media.coverImage.large,
      bannerImage: media.bannerImage || undefined,
      episodes: media.episodes || undefined,
      status: 'plan-to-watch', // Default status, will be updated from user's list
      progress: 0,
      rating: media.averageScore ? media.averageScore / 10 : undefined,
      genres: media.genres || [],
      year: media.startDate?.year || undefined,
      format: media.format as 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Attach extra AniList metadata for downstream consumers (mood recs, stats)
      ...(media.averageScore ? { averageScore: media.averageScore } : {}),
      ...(media.popularity ? { popularity: media.popularity } : {}),
      ...(media.trending ? { trending: media.trending } : {}),
      ...(media.tags ? { tags: media.tags.map((t) => t.name) } : {}),
    }
  }

  /**
   * Fetch franchise timeline (all seasons in order) for an anime
   * Walks prequels to find root, then follows sequels to build complete timeline
   * Returns: [Season 1, Season 2, Season 3, ...] in order
   */
  async getFranchiseTimeline(mediaId: number): Promise<Anime[]> {
    console.log('[AniVault] Fetching franchise timeline for media ID:', mediaId)
    
    const query = `
      query GetMediaWithRelations($id: Int) {
        Media(id: $id) {
          id
          title {
            romaji
            english
            native
          }
          episodes
          format
          coverImage {
            large
            medium
          }
          bannerImage
          description
          status
          genres
          averageScore
          popularity
          startDate {
            year
            month
            day
          }
          relations {
            edges {
              relationType
              node {
                id
                title {
                  romaji
                  english
                  native
                }
                episodes
                format
              }
            }
          }
        }
      }
    `

    try {
      // Step A: Find the root (walk back through prequels)
      let currentId = mediaId
      let root: any | null = null
      const visited = new Set<number>()

      while (true) {
        if (visited.has(currentId)) {
          console.warn('[AniVault] Circular relation detected, breaking')
          break
        }
        visited.add(currentId)

        const response = await this.graphqlRequest<{ data: { Media: any } }>(query, { id: currentId })
        const media = response.data.Media

        // Check for prequel
        const prequelEdge = media.relations?.edges?.find((edge: any) => edge.relationType === 'PREQUEL')
        
        if (prequelEdge && prequelEdge.node) {
          console.log(`[AniVault] Found prequel: ${prequelEdge.node.title.romaji} (${prequelEdge.node.id})`)
          currentId = prequelEdge.node.id
        } else {
          // No prequel = this is the root
          root = media
          console.log(`[AniVault] Found root: ${media.title.romaji} (${media.id})`)
          break
        }
      }

      if (!root) {
        console.warn('[AniVault] Failed to find root, using original media')
        const response = await this.graphqlRequest<{ data: { Media: any } }>(query, { id: mediaId })
        root = response.data.Media
      }

      // Step B & C: Build timeline by walking sequels from root
      const timeline: Anime[] = []
      const timelineVisited = new Set<number>()
      let current = root

      while (current) {
        if (timelineVisited.has(current.id)) {
          console.warn('[AniVault] Circular sequel detected, breaking')
          break
        }
        timelineVisited.add(current.id)

        // Add current to timeline
        const anime = this.mapAniListMediaToAnime(current)
        timeline.push(anime)
        console.log(`[AniVault] Timeline [${timeline.length}]: ${anime.title} (${anime.episodes || '?'} eps)`)

        // Find sequel
        const sequelEdge = current.relations?.edges?.find((edge: any) => edge.relationType === 'SEQUEL')
        
        if (sequelEdge && sequelEdge.node) {
          console.log(`[AniVault] Found sequel: ${sequelEdge.node.title.romaji}`)
          // Fetch full data for sequel
          const seqResponse = await this.graphqlRequest<{ data: { Media: any } }>(query, { id: sequelEdge.node.id })
          current = seqResponse.data.Media
        } else {
          // No more sequels
          break
        }
      }

      console.log(`[AniVault] ✅ Franchise timeline complete: ${timeline.length} season(s)`)
      return timeline

    } catch (error) {
      console.error('[AniVault] Failed to fetch franchise timeline:', error)
      // Fallback: return just the requested anime
      try {
        const response = await this.graphqlRequest<{ data: { Media: any } }>(query, { id: mediaId })
        return [this.mapAniListMediaToAnime(response.data.Media)]
      } catch {
        return []
      }
    }
  }
}

// Export singleton instance
export const anilistService = new AniListService()

