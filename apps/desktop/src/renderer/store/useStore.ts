import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Anime } from '@anivault/shared'
import type { WatchEvent, WatchSource } from '../services/stats.service'
import { anilistService } from '../services/anilist.service'
import { loginWithAnilist, getStoredToken, logout as authLogout } from '../services/auth.service'
import { validateLicenseKey, getStoredLicenseKey, storeLicenseKey } from '../services/licensing.service'

interface AppState {
  // User state
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  accessToken: string | null

  // License state
  isPro: boolean
  licenseKey: string | null

  // Library state
  library: Anime[]

  // Watch events log
  watchEvents: WatchEvent[]

  // Theme state
  theme: string

  // Discord presence preferences
  discordPresenceEnabled: boolean
  discordPresenceMode: 'minimal' | 'stats' | 'weeb'
  discordPresenceUseMood: boolean
  discordPresenceShowButtons: boolean
  lastPresenceContext?: { title: string; episode: number; totalEpisodes?: number }
  // Auto Organizer
  organizerSourceDir: string | null
  organizerTargetRoot: string | null

  // Title mappings: Map "Filename Title" -> "AniList ID"
  // Example: { "Kimetsu no Yaiba": "101922" }
  titleMappings: Record<string, string>

  // Actions
  login: () => Promise<void>
  logout: () => Promise<void>
  enableGuestMode: () => void
  checkAuth: () => Promise<void>
  validateLicense: (key: string) => Promise<boolean>
  checkLicense: () => Promise<void>
  activatePro: (key: string) => Promise<boolean>
  deactivatePro: () => Promise<void>
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  addToLibrary: (anime: Anime, status: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch') => Promise<void>
  removeFromLibrary: (animeId: string) => void
  updateStatus: (animeId: string, status: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch') => Promise<void>
  updateProgress: (animeId: string, updates: { status?: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch'; progress?: number }, source?: WatchSource) => Promise<void>
  updateEntry: (animeId: string, updates: { status?: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch'; progress?: number }) => Promise<void>
  logWatchEvents: (animeId: string, fromEpisode: number, toEpisode: number, source: WatchSource) => void
  addMapping: (filenameTitle: string, anilistId: string) => void
  findAnimeByTitle: (filenameTitle: string) => Anime | null
  devTogglePro: () => void
  setTheme: (themeId: string) => void
  setDiscordPresenceEnabled: (value: boolean) => void
  setDiscordPresenceMode: (mode: 'minimal' | 'stats' | 'weeb') => void
  setDiscordPresenceUseMood: (value: boolean) => void
  setDiscordPresenceShowButtons: (value: boolean) => void
  setLastPresenceContext: (ctx: { title: string; episode: number; totalEpisodes?: number } | undefined) => void
  setOrganizerSourceDir: (dir: string | null) => void
  setOrganizerTargetRoot: (dir: string | null) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isGuest: false,
      accessToken: null,
      isPro: false,
      licenseKey: null,
      library: [],
      watchEvents: [],
      theme: 'default',
      discordPresenceEnabled: true,
      discordPresenceMode: 'minimal',
      discordPresenceUseMood: true,
      discordPresenceShowButtons: true,
      lastPresenceContext: undefined,
      organizerSourceDir: null,
      organizerTargetRoot: null,
      titleMappings: {},

  // Login action
  login: async () => {
    try {
      const token = await loginWithAnilist()
      
      // 1. Set Token
      anilistService.setAccessToken(token)
      
      // 2. Fetch User Profile
      const anilistUser = await anilistService.getCurrentUser()
      
      const user: User = {
        id: anilistUser.id.toString(),
        username: anilistUser.name,
        avatar: anilistUser.avatar?.large,
        preferences: {
          theme: 'dark',
          autoTrack: true,
          syncEnabled: true,
          notifications: true,
          language: 'en',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // 3. Fetch Cloud Library
      console.log('Fetching library for user:', anilistUser.id)
      const cloudLibrary = await anilistService.getUserLibrary(anilistUser.id)
      console.log('Library fetched from cloud:', cloudLibrary.length, 'items')
      
      // 4. TRUE MERGE STRATEGY
      // Start with a copy of your CURRENT local library.
      // This ensures local-only items are PRESERVED.
      const currentLibrary = get().library
      const mergedLibrary = [...currentLibrary]
      console.log('Current local library:', currentLibrary.length, 'items')

      cloudLibrary.forEach((cloudAnime) => {
        const localIndex = mergedLibrary.findIndex((local) => local.id === cloudAnime.id)

        if (localIndex >= 0) {
          // CONFLICT: Item exists in both places.
          // We update the local copy with cloud details (syncing progress/score).
          mergedLibrary[localIndex] = {
            ...mergedLibrary[localIndex],
            ...cloudAnime, 
            updatedAt: new Date(),
          }
        } else {
          // NEW: Item exists on AniList but not locally.
          // We add it to the library.
          mergedLibrary.push(cloudAnime)
        }
      })

      // The result: mergedLibrary contains (Local Only) + (Cloud Only) + (Synced Shared)
      console.log('Merged library:', mergedLibrary.length, 'items')

      set({
        accessToken: token,
        user,
        isAuthenticated: true,
        library: mergedLibrary, // Save the merged list
      })
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },

  // Logout action
  logout: async () => {
    await authLogout()
    anilistService.setAccessToken(null)
    set({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      accessToken: null,
    })
  },

  // Enable guest mode
  enableGuestMode: () => {
    set({
      isGuest: true,
      isAuthenticated: false,
      user: null,
      accessToken: null,
    })
  },

  // Check authentication on app start
  checkAuth: async () => {
    try {
      const token = await getStoredToken()
      if (token) {
        anilistService.setAccessToken(token)
        
        // Try to fetch user to verify token is still valid
        const anilistUser = await anilistService.getCurrentUser()
        
        const user: User = {
          id: anilistUser.id.toString(),
          username: anilistUser.name,
          avatar: anilistUser.avatar?.large,
          preferences: {
            theme: 'dark',
            autoTrack: true,
            syncEnabled: true,
            notifications: true,
            language: 'en',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set({
          accessToken: token,
          user,
          isAuthenticated: true,
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Token is invalid, clear it
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      })
    }
  },

  // Validate license key
  validateLicense: async (key: string) => {
    try {
      const isValid = await validateLicenseKey(key)
      if (isValid) {
        set({
          isPro: true,
          licenseKey: key,
        })
        try {
          await storeLicenseKey(key)
        } catch (error) {
          console.error('Failed to store license key locally:', error)
        }
      } else {
        set({
          isPro: false,
          licenseKey: null,
        })
      }
      return isValid
    } catch (error) {
      console.error('License validation failed:', error)
      return false
    }
  },

  // Check stored license
  checkLicense: async () => {
    try {
      const key = await getStoredLicenseKey()
      if (key) {
        const isValid = await validateLicenseKey(key)
        set({
          isPro: isValid,
          licenseKey: isValid ? key : null,
        })
      }
    } catch (error) {
      console.error('License check failed:', error)
    }
  },

  // Activate Pro with a license key
  activatePro: async (key: string) => {
    const trimmedKey = key.trim()
    if (!trimmedKey) {
      return false
    }

    // Dev Bypass
    if (trimmedKey === 'DEV-PRO-TEST') {
      set({ isPro: true, licenseKey: trimmedKey })
      try {
        await storeLicenseKey(trimmedKey)
      } catch (error) {
        console.error('Failed to store license key locally:', error)
      }
      return true
    }

    try {
      // Use the new IPC handler
      const result = await window.electron.license.validate(trimmedKey)

      if (result.success) {
        set({ isPro: true, licenseKey: trimmedKey })
        try {
          await storeLicenseKey(trimmedKey)
        } catch (error) {
          console.error('Failed to store license key locally:', error)
        }
        return true
      }

      set({
        isPro: false,
        licenseKey: null,
      })
      return false
    } catch (error) {
      console.error('Activation error:', error)
      set({
        isPro: false,
        licenseKey: null,
      })
      return false
    }
  },

  // Deactivate Pro and remove stored key
  deactivatePro: async () => {
    set({
      isPro: false,
      licenseKey: null,
      theme: 'default',
    })
    try {
      await storeLicenseKey('')
    } catch (error) {
      console.error('Failed to clear license key:', error)
    }
  },

      // Dev helper: toggle Pro locally
      devTogglePro: () => {
        const wasPro = get().isPro
        const nextPro = !wasPro
        set({
          isPro: nextPro,
          ...(wasPro ? { theme: 'default' } : {}),
        })
      },

      setTheme: (themeId: string) => {
        const nextTheme = themeId && themeId.trim().length > 0 ? themeId : 'default'
        set({ theme: nextTheme })
      },

      setDiscordPresenceEnabled: (value: boolean) => set({ discordPresenceEnabled: value }),
      setDiscordPresenceMode: (mode: 'minimal' | 'stats' | 'weeb') => set({ discordPresenceMode: mode }),
      setDiscordPresenceUseMood: (value: boolean) => set({ discordPresenceUseMood: value }),
      setDiscordPresenceShowButtons: (value: boolean) => set({ discordPresenceShowButtons: value }),
      setLastPresenceContext: (ctx) => set({ lastPresenceContext: ctx }),
      setOrganizerSourceDir: (dir: string | null) => set({ organizerSourceDir: dir }),
      setOrganizerTargetRoot: (dir: string | null) => set({ organizerTargetRoot: dir }),

      // Setters
      setUser: (user: User | null) => set({ user }),
      setAccessToken: (token: string | null) => {
        anilistService.setAccessToken(token)
        set({ accessToken: token })
      },

      // Add to library
      addToLibrary: async (anime: Anime, status: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch') => {
        const { library, accessToken, isGuest } = get()
        
        // Check if anime already exists in library
        const existingIndex = library.findIndex(a => a.id === anime.id)
        
        const updatedAnime: Anime = {
          ...anime,
          status,
          updatedAt: new Date(),
        }

        let updatedLibrary: Anime[]
        if (existingIndex >= 0) {
          // Update existing entry
          updatedLibrary = [...library]
          updatedLibrary[existingIndex] = updatedAnime
        } else {
          // Add new entry
          updatedLibrary = [...library, updatedAnime]
        }

        set({ library: updatedLibrary })

        // Sync with AniList ONLY if authenticated (not guest mode)
        if (accessToken && !isGuest) {
          try {
            const mediaId = parseInt(anime.id)
            const progress = anime.progress || 0
            
            // Map our status to AniList status
            const anilistStatus = status === 'plan-to-watch' ? 'PLANNING' :
                                 status === 'watching' ? 'CURRENT' :
                                 status === 'completed' ? 'COMPLETED' :
                                 status === 'on-hold' ? 'PAUSED' : 'DROPPED'
            
            await anilistService.updateProgress(mediaId, progress, anilistStatus)
          } catch (error) {
            console.error('Failed to sync with AniList:', error)
            // Don't throw - library update succeeded locally
          }
        }
      },

      // Remove from library
      removeFromLibrary: (animeId: string) => {
        const { library } = get()
        const updatedLibrary = library.filter((a) => a.id !== animeId)
        set({ library: updatedLibrary })
      },

      // Update status
      updateStatus: async (animeId: string, status: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch') => {
        const { library, accessToken } = get()
        const existingIndex = library.findIndex((a) => a.id === animeId)
        
        if (existingIndex === -1) {
          console.warn('Anime not found in library')
          return
        }

        const anime = library[existingIndex]
        const updatedAnime: Anime = {
          ...anime,
          status,
          updatedAt: new Date(),
        }

        const updatedLibrary = [...library]
        updatedLibrary[existingIndex] = updatedAnime
        set({ library: updatedLibrary })

        // Sync with AniList if authenticated (not guest mode)
        if (accessToken && !get().isGuest) {
          try {
            const mediaId = parseInt(animeId)
            const progress = anime.progress || 0
            
            // Map our status to AniList status
            const anilistStatus = status === 'plan-to-watch' ? 'PLANNING' :
                                 status === 'watching' ? 'CURRENT' :
                                 status === 'completed' ? 'COMPLETED' :
                                 status === 'on-hold' ? 'PAUSED' : 'DROPPED'
            
            await anilistService.updateProgress(mediaId, progress, anilistStatus)
          } catch (error) {
            console.error('Failed to sync with AniList:', error)
            // Don't throw - library update succeeded locally
          }
        }
      },

      // Log watch events for a range of episodes
      logWatchEvents: (animeId, fromEpisode, toEpisode, source) => {
        const animeIdNum = Number(animeId)
        if (!Number.isFinite(animeIdNum)) return

        const now = Date.now()

        set((state) => {
          const events: WatchEvent[] = []
          const start = Math.min(fromEpisode, toEpisode)
          const end = Math.max(fromEpisode, toEpisode)

          for (let ep = start; ep <= end; ep++) {
            events.push({
              animeId: animeIdNum,
              episode: ep,
              at: new Date(now + (ep - start) * 1000).toISOString(), // slight offset just to keep order
              source,
            })
          }

          return {
            watchEvents: [...state.watchEvents, ...events],
          }
        })
      },

      // Update progress
      updateProgress: async (
        animeId: string,
        updates: { status?: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch'; progress?: number },
        source: WatchSource = 'manual'
      ) => {
        const { library, accessToken } = get()
        const existingIndex = library.findIndex((a) => a.id === animeId)

        if (existingIndex === -1) {
          console.warn('Anime not found in library')
          return
        }

        const anime = library[existingIndex]

        const currentProgress = typeof anime.progress === 'number' ? anime.progress : 0
        const episodesRaw = (anime as any).episodes
        const totalEpisodes =
          typeof episodesRaw === 'number'
            ? episodesRaw
            : Number.isFinite(Number(episodesRaw))
            ? Number(episodesRaw)
            : null

        let nextProgress = updates.progress ?? currentProgress

        // Never go backwards
        if (nextProgress < currentProgress) {
          nextProgress = currentProgress
        }

        // Never exceed total episodes if known
        if (totalEpisodes !== null && nextProgress > totalEpisodes) {
          nextProgress = totalEpisodes
        }

        // If anime is in "plan-to-watch" or "dropped" status, automatically change to "watching"
        // when an episode is detected (user is actively watching)
        const nextStatus =
          updates.status ??
          (anime.status === 'plan-to-watch' || anime.status === 'dropped'
            ? 'watching'
            : totalEpisodes !== null && nextProgress >= totalEpisodes
            ? 'completed'
            : anime.status)

        const updatedAnime: Anime = {
          ...anime,
          ...(nextStatus && { status: nextStatus }),
          ...(Number.isFinite(nextProgress) && { progress: nextProgress }),
          updatedAt: new Date(),
        }

        const updatedLibrary = [...library]
        updatedLibrary[existingIndex] = updatedAnime
        set({ library: updatedLibrary })

        // Log watch events for newly watched episodes
        if (
          nextProgress > currentProgress &&
          Number.isFinite(nextProgress) &&
          source
        ) {
          get().logWatchEvents(
            animeId,
            currentProgress + 1,
            nextProgress,
            source
          )
        }

        // Sync with AniList if authenticated (not guest mode)
        if (accessToken && !get().isGuest) {
          try {
            const mediaId = parseInt(animeId)
            const progress = updatedAnime.progress || 0
            const status = updatedAnime.status

            const anilistStatus =
              status === 'plan-to-watch'
                ? 'PLANNING'
                : status === 'watching'
                ? 'CURRENT'
                : status === 'completed'
                ? 'COMPLETED'
                : status === 'on-hold'
                ? 'PAUSED'
                : 'DROPPED'

            await anilistService.updateProgress(
              mediaId,
              progress,
              anilistStatus,
              updates.progress
            )
          } catch (error) {
            console.error('Failed to sync with AniList:', error)
            // Don't throw - library update succeeded locally
          }
        }
      },

      // Update entry (status and/or progress)
      updateEntry: async (animeId: string, updates: { status?: 'watching' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-watch'; progress?: number }) => {
        const { library, accessToken } = get()
        const existingIndex = library.findIndex((a) => a.id === animeId)
        
        if (existingIndex === -1) {
          console.warn('Anime not found in library')
          return
        }

        const anime = library[existingIndex]
        const updatedAnime: Anime = {
          ...anime,
          ...(updates.status && { status: updates.status }),
          ...(updates.progress !== undefined && { progress: updates.progress }),
          updatedAt: new Date(),
        }

        const updatedLibrary = [...library]
        updatedLibrary[existingIndex] = updatedAnime
        set({ library: updatedLibrary })

        // Sync with AniList if authenticated (not guest mode)
        if (accessToken && !get().isGuest) {
          try {
            const mediaId = parseInt(animeId)
            const progress = updatedAnime.progress || 0
            const status = updatedAnime.status
            
            // Map our status to AniList status
            const anilistStatus = status === 'plan-to-watch' ? 'PLANNING' :
                                 status === 'watching' ? 'CURRENT' :
                                 status === 'completed' ? 'COMPLETED' :
                                 status === 'on-hold' ? 'PAUSED' : 'DROPPED'
            
            await anilistService.updateProgress(mediaId, progress, anilistStatus, updates.progress)
          } catch (error) {
            console.error('Failed to sync with AniList:', error)
            // Don't throw - library update succeeded locally
          }
        }
      },

      // Add title mapping
      addMapping: (filenameTitle: string, anilistId: string) => {
        const { titleMappings } = get()
        set({
          titleMappings: {
            ...titleMappings,
            [filenameTitle.toLowerCase()]: anilistId,
          },
        })
      },

      // Find anime by title (checks library and mappings)
      findAnimeByTitle: (filenameTitle: string) => {
        const { library, titleMappings } = get()
        const normalizedTitle = filenameTitle.toLowerCase().trim()

        // Helper: Extract season number from title
        const getSeasonNumber = (title: string): number | null => {
          const lower = title.toLowerCase()
          
          // "Season 2", "2nd Season", "Part 2"
          const seasonMatch = lower.match(/season\s+(\d+)/i) || 
                            lower.match(/(\d+)(?:st|nd|rd|th)\s+season/i) ||
                            lower.match(/part\s+(\d+)/i)
          if (seasonMatch?.[1]) return parseInt(seasonMatch[1], 10)
          
          // "S2"
          const shortMatch = lower.match(/\bs(\d+)\b/i)
          if (shortMatch?.[1]) return parseInt(shortMatch[1], 10)
          
          // Roman numerals: II, III, IV, V
          const romanMatch = lower.match(/\s+(ii|iii|iv|v|vi|vii|viii|ix|x)$/i)
          if (romanMatch) {
            const romanMap: Record<string, number> = {
              'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
              'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
            }
            return romanMap[romanMatch[1].toLowerCase()] || null
          }
          
          return null // No season = Season 1
        }

        const searchSeasonNum = getSeasonNumber(normalizedTitle) || 1

        // First, check if we have a mapping for this title
        const mappedId = titleMappings[normalizedTitle]
        if (mappedId) {
          const mappedAnime = library.find((a) => a.id === mappedId)
          if (mappedAnime) {
            return mappedAnime
          }
        }

        // Try exact title match
        const exactMatch = library.find(
          (anime) =>
            anime.title.toLowerCase() === normalizedTitle ||
            anime.titleEnglish?.toLowerCase() === normalizedTitle ||
            anime.titleJapanese?.toLowerCase() === normalizedTitle
        )
        if (exactMatch) {
          return exactMatch
        }

        // Fuzzy match with strict season filtering
        const candidates = library.filter((anime) => {
          const animeTitle = anime.title.toLowerCase()
          const animeEnglish = anime.titleEnglish?.toLowerCase() || ''
          const animeJapanese = anime.titleJapanese?.toLowerCase() || ''
          
          // Check if titles overlap
          const titleMatches = normalizedTitle.includes(animeTitle) ||
                              animeTitle.includes(normalizedTitle) ||
                              (animeEnglish && (normalizedTitle.includes(animeEnglish) || animeEnglish.includes(normalizedTitle))) ||
                              (animeJapanese && (normalizedTitle.includes(animeJapanese) || animeJapanese.includes(normalizedTitle)))
          
          if (!titleMatches) return false
          
          // Strict season filtering
          const animeSeasonNum = getSeasonNumber(anime.title) || 1
          
          if (searchSeasonNum !== animeSeasonNum) {
            // Reject wrong season
            return false
          }
          
          return true
        })

        if (candidates.length === 0) {
          return null
        }

        // Sort by string length similarity (prefer exact length matches)
        candidates.sort((a, b) => {
          const aDiff = Math.abs(a.title.length - filenameTitle.length)
          const bDiff = Math.abs(b.title.length - filenameTitle.length)
          return aDiff - bDiff
        })

        return candidates[0]
      },
    }),
    {
      name: 'anivault-storage', // localStorage key
      partialize: (state) => ({ 
        library: state.library,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        accessToken: state.accessToken,
        isPro: state.isPro,
        licenseKey: state.licenseKey,
        theme: state.theme,
        discordPresenceEnabled: state.discordPresenceEnabled,
        discordPresenceMode: state.discordPresenceMode,
        discordPresenceUseMood: state.discordPresenceUseMood,
        discordPresenceShowButtons: state.discordPresenceShowButtons,
        lastPresenceContext: state.lastPresenceContext,
        organizerSourceDir: state.organizerSourceDir,
        organizerTargetRoot: state.organizerTargetRoot,
        titleMappings: state.titleMappings,
        watchEvents: state.watchEvents,
      }), // Persist library, user, auth state, guest mode, title mappings, and watch events
    }
  )
)

