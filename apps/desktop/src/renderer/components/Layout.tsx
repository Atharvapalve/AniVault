import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'
import TitleBar from './TitleBar'
import Library from './Library'
import Discover from './Discover'
import WelcomeScreen from './WelcomeScreen'
import HomeDashboard from './HomeDashboard'
import Toast from './Toast'
import AnimeMatchModal from './AnimeMatchModal'
import LicenseSettings from './LicenseSettings'
import StatsDashboard from './StatsDashboard'
import ThemeSelector from './settings/ThemeSelector'
import AutoOrganizerPanel from './AutoOrganizerPanel'
import { useStore } from '../store/useStore'
import { anilistService } from '../services/anilist.service'
import { resolveFranchiseEpisode } from '../services/tracking.service'
import { convertGlobalToSeasonEpisode } from '@anivault/shared'
import type { WatchEvent } from '../services/stats.service'

function computeEpisodesToday(events: WatchEvent[]): number {
  if (!events || events.length === 0) return 0
  const todayStr = new Date().toISOString().slice(0, 10)
  return events.filter((ev) => ev.at.startsWith(todayStr)).length
}

function computeEpisodesThisSession(events: WatchEvent[]): number {
  if (!events || events.length === 0) return 0
  const now = Date.now()
  const twoHoursAgo = now - 2 * 60 * 60 * 1000
  return events.filter((ev) => new Date(ev.at).getTime() >= twoHoursAgo).length
}

function inferMoodLabel(): { label?: string; emoji?: string } {
  const hour = new Date().getHours()
  if (hour >= 22 || hour < 3) return { label: 'Late night anime', emoji: '🌙' }
  if (hour >= 18 && hour < 22) return { label: 'Evening binge', emoji: '🔥' }
  if (hour >= 12 && hour < 18) return { label: 'Daytime chill', emoji: '😌' }
  return { label: 'Anime break', emoji: '🎧' }
}

const Layout = () => {
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState('home') // <--- State to track the page
  const [searchQuery, setSearchQuery] = useState('') // <--- Search query for discover page
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [matchModalOpen, setMatchModalOpen] = useState(false)
  const [pendingDetection, setPendingDetection] = useState<{ title: string; episode: number } | null>(null)
  const {
    isAuthenticated,
    isGuest,
    library,
    accessToken,
    updateProgress,
    findAnimeByTitle,
    addMapping,
    addToLibrary,
    login,
    logout,
    user,
    isPro,
    theme,
    discordPresenceEnabled,
    discordPresenceMode,
    discordPresenceUseMood,
    discordPresenceShowButtons,
    setDiscordPresenceEnabled,
    setDiscordPresenceMode,
    setDiscordPresenceUseMood,
    setDiscordPresenceShowButtons,
    lastPresenceContext,
    setLastPresenceContext,
    watchEvents,
  } = useStore()

  const pushPresenceConfig = (partial?: Partial<{
    enabled: boolean
    mode: 'minimal' | 'stats' | 'weeb'
    useMood: boolean
    showButtons: boolean
  }>) => {
    if (!window.electron?.presence) return
    void window.electron.presence.updateConfig({
      enabled: partial?.enabled ?? discordPresenceEnabled,
      mode: partial?.mode ?? discordPresenceMode,
      useMood: partial?.useMood ?? discordPresenceUseMood,
      showButtons: partial?.showButtons ?? discordPresenceShowButtons,
    })
  }

  const sendPresenceUpdate = (title: string, episode: number, totalEpisodes?: number) => {
    if (!window.electron?.presence) return
    if (!discordPresenceEnabled) return

    const episodesToday = computeEpisodesToday(watchEvents || [])
    const episodesThisSession = computeEpisodesThisSession(watchEvents || [])
    const moodInfo = discordPresenceUseMood && isPro ? inferMoodLabel() : { label: undefined, emoji: undefined }

    // push config
    pushPresenceConfig()

    // push current context
    void window.electron.presence.updateNow({
      title,
      episode,
      totalEpisodes,
      episodesThisSession,
      episodesToday,
      moodLabel: moodInfo.label,
      moodEmoji: moodInfo.emoji,
      themeId: theme,
      isPro,
    })

    setLastPresenceContext({ title, episode, totalEpisodes })
  }

  // Clear search when navigating to a different page
  const handleNavigate = (page: string) => {
    setSearchQuery('') // Always clear search when navigating
    setCurrentPage(page)
  }

  // Listen for tracking updates from main process
  useEffect(() => {
    if (!isAuthenticated && !isGuest) return

    const handleTrackingUpdate = async (data: { 
      title: string
      episode: number
      overallEpisode?: number
      seasonNumber?: number
      seasonEpisode?: number
      source?: string
      platform?: string
    }) => {
      console.log('[AniVault] Renderer received tracking update:', data)
      
      setToastMessage(`Detected ${data.title} Ep ${data.episode}. Matching...`)
      setToastVisible(true)

      // Try to find matching anime in library
      let matchingAnime = findAnimeByTitle(data.title)
      
      // STRICT season verification - never update the wrong season
      if (matchingAnime && data.seasonNumber) {
        const animeTitle = matchingAnime.title.toLowerCase()
        const detectedSeason = data.seasonNumber
        
        console.log(`[AniVault] Verifying season match:`, {
          detected: `Season ${detectedSeason}`,
          foundTitle: matchingAnime.title
        })
        
        // For Season 1: match if title has NO season number OR has "Season 1"
        if (detectedSeason === 1) {
          const hasNoSeasonSuffix = !animeTitle.match(/season\s+\d+/i) && !animeTitle.match(/\s+s\d+/i) && !animeTitle.match(/part\s+\d+/i)
          const hasSeasonOne = animeTitle.includes('season 1') || animeTitle.includes(' s1') || animeTitle.includes('part 1')
          
          if (!hasNoSeasonSuffix && !hasSeasonOne) {
            console.log(`[AniVault] ❌ Found "${matchingAnime.title}" but it's not Season 1, searching for S1...`)
            matchingAnime = null
          } else {
            console.log(`[AniVault] ✅ Verified as Season 1`)
          }
        } else {
          // For Season 2+: must have explicit season number in title
          const hasCorrectSeason = animeTitle.includes(`season ${detectedSeason}`) || 
                                   animeTitle.includes(` s${detectedSeason} `) ||
                                   animeTitle.includes(` s${detectedSeason}:`) ||
                                   animeTitle.match(new RegExp(`\\bs${detectedSeason}\\b`, 'i')) ||
                                   animeTitle.includes(`part ${detectedSeason}`)
          
          if (!hasCorrectSeason) {
            console.log(`[AniVault] ❌ Found "${matchingAnime.title}" but doesn't match Season ${detectedSeason}, searching for correct season...`)
            matchingAnime = null
          } else {
            console.log(`[AniVault] ✅ Verified as Season ${detectedSeason}`)
          }
        }
      }

      // If no match in library, try smart AniList search
      if (!matchingAnime) {
        console.log('[AniVault] No library match, searching AniList...')
        try {
          // Include season in search query if available
          let searchQuery = data.title
          if (data.seasonNumber && data.seasonNumber > 1) {
            searchQuery = `${data.title} Season ${data.seasonNumber}`
            console.log(`[AniVault] Including season in search: "${searchQuery}"`)
          }
          
          const results = await anilistService.searchAnime(searchQuery, {}, 1, 10)
          console.log(`[AniVault] AniList search for "${searchQuery}" returned ${results.length} results`)
          
          // Filter results by season if specified
          let filteredResults = results
          if (data.seasonNumber) {
            filteredResults = results.filter(result => {
              const title = result.title.toLowerCase()
              
              if (data.seasonNumber === 1) {
                // Season 1: accept if no season suffix OR has "Season 1"
                const hasNoSeason = !title.match(/season\s+\d+/i) && !title.match(/\s+s\d+/i)
                const hasSeason1 = title.includes('season 1') || title.match(/\bs1\b/i) || title.includes('part 1')
                return hasNoSeason || hasSeason1
              } else {
                // Season 2+: must have correct season number
                return title.includes(`season ${data.seasonNumber}`) ||
                       title.match(new RegExp(`\\bs${data.seasonNumber}\\b`, 'i')) ||
                       title.includes(`part ${data.seasonNumber}`)
              }
            })
            console.log(`[AniVault] Filtered to ${filteredResults.length} results matching Season ${data.seasonNumber}`)
          }
          
          // Smart auto-match
          if (filteredResults.length > 0) {
            const bestMatch = filteredResults[0]
            const detectedTitleLower = data.title.toLowerCase()
            const resultTitleLower = bestMatch.title.toLowerCase()
            const resultEnglishLower = bestMatch.titleEnglish?.toLowerCase() || ''
            
            // Check for exact or very close match
            const isExactMatch = resultTitleLower === detectedTitleLower || 
                                resultEnglishLower === detectedTitleLower ||
                                resultTitleLower.includes(detectedTitleLower) ||
                                detectedTitleLower.includes(resultTitleLower)
            
            // Auto-select if only 1 filtered result OR exact match
            if (filteredResults.length === 1 || isExactMatch) {
              console.log('[AniVault] ✅ Smart auto-match found:', bestMatch.title)
              
              // Add to library as "watching"
              await addToLibrary(bestMatch, 'watching')
              
              // Create mapping for future
              addMapping(data.title, bestMatch.id)
              
              matchingAnime = bestMatch
            } else {
              console.log(`[AniVault] Multiple filtered results (${filteredResults.length}), showing modal`)
              console.log('[AniVault] Best match:', bestMatch.title, '| isExactMatch:', isExactMatch)
              setPendingDetection(data)
              setMatchModalOpen(true)
              return
            }
          } else {
            console.log('[AniVault] No season-matching results from AniList, showing modal')
            setPendingDetection(data)
            setMatchModalOpen(true)
            return
          }
        } catch (error) {
          console.error('[AniVault] AniList search failed:', error)
          setPendingDetection(data)
          setMatchModalOpen(true)
          return
        }
      }

          if (matchingAnime) {
        console.log(`[AniVault] ✅ Matched anime: ${matchingAnime.title}`)
        
        const totalEpisodes = (matchingAnime as any).episodes as number | undefined
        let nextEpisode = data.episode
        let finalAnime = matchingAnime
        let resolvedSeasonEpisode: number | null = null
        let resolvedSeasonNumber: number | null = data.seasonNumber ?? null
        
        // CRITICAL SAFEGUARD: Double-check season match before ANY updates
        if (data.seasonNumber) {
          const animeTitle = matchingAnime.title.toLowerCase()
          const detectedSeason = data.seasonNumber
          let seasonVerified = false
          
          if (detectedSeason === 1) {
            // Season 1: title should have no season suffix OR "Season 1"
            const hasNoSeason = !animeTitle.match(/season\s+[2-9]/i) && !animeTitle.match(/\bs[2-9]\b/i)
            const hasSeason1 = animeTitle.includes('season 1') || animeTitle.match(/\bs1\b/i)
            seasonVerified = hasNoSeason || hasSeason1
          } else {
            // Season 2+: title must have the exact season number
            seasonVerified = animeTitle.includes(`season ${detectedSeason}`) ||
                           animeTitle.match(new RegExp(`\\bs${detectedSeason}\\b`, 'i')) !== null ||
                           animeTitle.includes(`part ${detectedSeason}`)
          }
          
          if (!seasonVerified) {
            console.error(`[AniVault] ❌ SEASON MISMATCH: Matched "${matchingAnime.title}" but detection says Season ${detectedSeason}!`)
            console.error(`[AniVault] This would update the WRONG season. Aborting and showing modal.`)
            setPendingDetection(data)
            setMatchModalOpen(true)
            return
          }
          
          console.log(`[AniVault] ✅ Season ${detectedSeason} verified for: ${matchingAnime.title}`)
        }

        // If Crunchyroll sent global numbering + season, convert to season-local episode using per-season counts
        if (data.overallEpisode && data.seasonNumber) {
          try {
            const timeline = await anilistService.getFranchiseTimeline(parseInt(matchingAnime.id))
            if (timeline && timeline.length >= data.seasonNumber) {
              const episodeCounts = timeline.map((s) => (s as any).episodes || 0)
              const seasonEpisode = convertGlobalToSeasonEpisode(data.overallEpisode, data.seasonNumber, episodeCounts)
              const seasonAnime = timeline[data.seasonNumber - 1]

              console.log(
                `[AniVault] [Season-Fix] Global E${data.overallEpisode} -> S${data.seasonNumber}E${seasonEpisode} using counts`,
                episodeCounts
              )

              if (seasonAnime) {
                finalAnime = seasonAnime
                nextEpisode = seasonEpisode
                resolvedSeasonEpisode = seasonEpisode
                resolvedSeasonNumber = data.seasonNumber

                const inLib = library.find((a) => a.id === seasonAnime.id)
                if (!inLib) {
                  console.log(`[AniVault] Adding season entry to library: ${seasonAnime.title}`)
                  await addToLibrary(seasonAnime, 'watching')
                }
              }
            }
          } catch (err) {
            console.warn('[AniVault] Season conversion failed, falling back to existing logic:', err)
          }
        }
        
        // CRITICAL: Determine if we need franchise resolution
        // Some shows use continuous numbering (Kaiju: E1-E12 S1, E13+ S2)
        // Others use per-season numbering (OPM: S1 E1-E12, S2 E1-E12, S3 E1-E12)
        
        // Heuristic for continuous numbering:
        // 1. Episode exceeds matched anime's total episodes (e.g., E19 for S2 with 11 eps), OR
        // 2. Episode > 24 AND we have season info (likely continuous), OR
        // 3. We're in Season 2+ but episode is way higher than expected
        const needsResolution = data.overallEpisode && (
          (totalEpisodes && data.overallEpisode > totalEpisodes) ||
          (data.overallEpisode > 24 && data.seasonNumber && data.seasonNumber > 1)
        )
        
        console.log(`[AniVault] Episode resolution check:`, {
          overallEpisode: data.overallEpisode,
          seasonNumber: data.seasonNumber,
          matchedAnimeTotal: totalEpisodes,
          needsResolution
        })
        
        if (needsResolution) {
          console.log(`[AniVault] 🔄 Using franchise resolver for global episode ${data.overallEpisode}`)
          console.log(`[AniVault] Initial match: ${matchingAnime.title} (${matchingAnime.id})`)
          
          try {
            // Get full franchise timeline (all seasons in order)
            console.log(`[AniVault] Fetching franchise timeline...`)
            const timeline = await anilistService.getFranchiseTimeline(parseInt(matchingAnime.id))
            console.log(`[AniVault] Timeline fetched: ${timeline.length} season(s)`)
            timeline.forEach((s, i) => {
              console.log(`  [${i + 1}] ${s.title} - ${(s as any).episodes || '?'} episodes`)
            })
            
            if (timeline.length > 1) {
              // Multi-season franchise - resolve to correct season
              console.log(`[AniVault] Resolving episode ${data.overallEpisode} across ${timeline.length} seasons...`)
              const resolved = resolveFranchiseEpisode(timeline, data.overallEpisode)
              
              if (resolved) {
                console.log(`[AniVault] ✅ [SmartTrack] Mapped Absolute Ep ${data.overallEpisode} to ${resolved.title} Ep ${resolved.episode}`)
                
                // Use the resolved season and episode
                const correctSeason = timeline.find(a => a.id === resolved.animeId)
                if (correctSeason) {
                  finalAnime = correctSeason
                  nextEpisode = resolved.episode
                  
                  // Check if it's in library, if not add it
                  const inLibrary = library.find(a => a.id === correctSeason.id)
                  if (!inLibrary) {
                    console.log(`[AniVault] Adding ${correctSeason.title} to library as "watching"`)
                    await addToLibrary(correctSeason, 'watching')
                  }
                  
                  console.log(`[AniVault] Will update: ${finalAnime.title} to ${nextEpisode}/${(finalAnime as any).episodes}`)
                } else {
                  console.warn('[AniVault] Could not find resolved season in timeline')
                }
              } else {
                console.warn('[AniVault] Resolver returned null, using original episode')
              }
            } else {
              // Single season, use episode as-is
              console.log(`[AniVault] Single-season anime, using episode ${data.overallEpisode} as-is`)
            }
          } catch (err) {
            console.error('[AniVault] ❌ Failed to fetch franchise timeline:', err)
            console.warn('[AniVault] Falling back to original episode number')
          }
        } else if (data.seasonNumber) {
          // Has season number but doesn't need resolution
          // This is likely per-season numbering (e.g., OPM S3 E7)
          console.log(`[AniVault] ✅ Per-season numbering detected (S${data.seasonNumber} E${data.episode}), using episode as-is`)
        }
        
        // Final episode validation - don't clamp if it seems correct
        const finalTotalEpisodes = (finalAnime as any).episodes as number | undefined
        if (finalTotalEpisodes && nextEpisode > finalTotalEpisodes) {
          console.log(`[AniVault] ⚠️ Episode ${nextEpisode} still exceeds total ${finalTotalEpisodes} after resolution, clamping`)
          nextEpisode = finalTotalEpisodes
        }
        
        console.log(`[AniVault] 📝 Updating progress:`, {
          id: finalAnime.id,
          title: finalAnime.title,
          episode: nextEpisode,
          totalEpisodes: finalTotalEpisodes,
          displayAs: `${nextEpisode}/${finalTotalEpisodes || '?'}`
        })
        
        // Update progress and ensure status is "watching"
        try {
          await updateProgress(finalAnime.id, { progress: nextEpisode, status: 'watching' }, 'desktop')
          setToastMessage(`Updated ${finalAnime.title} to Episode ${nextEpisode}/${finalTotalEpisodes || '?'}`)
          sendPresenceUpdate(finalAnime.title, nextEpisode, finalTotalEpisodes)
        } catch (error) {
          console.error('Failed to update progress:', error)
          setToastMessage(`Failed to update ${finalAnime.title}`)
        }
      }
    }

    console.log('[AniVault] 🎧 Attaching tracking:detected listener...')
    window.electron.tracking.onUpdate(handleTrackingUpdate)

    // Test IPC connection
    console.log('[AniVault] Tracking listener attached, waiting for events...')

    return () => {
      console.log('[AniVault] Removing tracking listener')
      window.electron.tracking.removeListener()
    }
  }, [isAuthenticated, isGuest, accessToken, findAnimeByTitle, updateProgress, addToLibrary, addMapping, library])

  // Clear old presence context on app startup if no recent activity
  useEffect(() => {
    if (lastPresenceContext && watchEvents) {
      const hasRecentActivity = watchEvents.length > 0 && 
        watchEvents[watchEvents.length - 1] &&
        Date.now() - new Date(watchEvents[watchEvents.length - 1].at).getTime() < 60000 // Within last minute

      if (!hasRecentActivity) {
        // Clear old presence context on startup
        setLastPresenceContext(undefined)
      }
    }
  }, []) // Only run on mount

  // Re-send presence when mode/toggles change (and we have last context)
  // Only if we're actively watching
  useEffect(() => {
    if (!discordPresenceEnabled) return
    if (!lastPresenceContext) return
    if (!window.electron?.presence) return

    // Only update if there's recent activity (actively watching)
    const hasRecentActivity = watchEvents && watchEvents.length > 0 && 
      watchEvents[watchEvents.length - 1] &&
      Date.now() - new Date(watchEvents[watchEvents.length - 1].at).getTime() < 60000 // Within last minute

    if (!hasRecentActivity) {
      return // Don't restore old presence
    }

    pushPresenceConfig()
    sendPresenceUpdate(
      lastPresenceContext.title,
      lastPresenceContext.episode,
      lastPresenceContext.totalEpisodes
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discordPresenceMode, discordPresenceUseMood, discordPresenceShowButtons])

  // Handle anime match from modal
  const handleAnimeMatch = async (anime: any, episode: number) => {
    try {
      console.log('[AniVault] User selected from modal:', anime.title, 'Ep', episode)
      
      // Add mapping for future detections
      addMapping(pendingDetection?.title || '', anime.id)

      // Check if anime is in library
      const libraryEntry = library.find((a) => a.id === anime.id)
      
      if (!libraryEntry) {
        // Add to library as "watching"
        console.log('[AniVault] Adding to library as "watching"')
        await addToLibrary(anime, 'watching')
      }

      // Determine if we need franchise resolution
      let nextEpisode = episode
      const totalEpisodes = (anime as any).episodes as number | undefined
      const overallEp = (pendingDetection as any)?.overallEpisode
      const seasonNum = (pendingDetection as any)?.seasonNumber
      
      // Heuristic: Only use franchise resolver if episode > 24 OR exceeds total
      // This avoids wrongly resolving per-season numbered shows (like OPM S3 E7)
      const needsResolution = overallEp && (
        overallEp > 24 || 
        (totalEpisodes && overallEp > totalEpisodes)
      )
      
      if (needsResolution) {
        console.log(`[AniVault] Modal: Using franchise resolver for global episode ${overallEp}`)
        
        try {
          const timeline = await anilistService.getFranchiseTimeline(parseInt(anime.id))
          console.log(`[AniVault] Timeline fetched: ${timeline.length} season(s)`)
          
          if (timeline.length > 1) {
            const resolved = resolveFranchiseEpisode(timeline, overallEp)
            if (resolved) {
              console.log(`[AniVault] ✅ [SmartTrack Modal] Mapped Absolute Ep ${overallEp} to ${resolved.title} Ep ${resolved.episode}`)
              nextEpisode = resolved.episode
              
              // If resolved to a different season, update the anime reference
              if (resolved.animeId !== anime.id) {
                const correctSeason = timeline.find(a => a.id === resolved.animeId)
                if (correctSeason) {
                  console.log(`[AniVault] Switching to correct season: ${correctSeason.title}`)
                  anime = correctSeason
                  const inLib = library.find(a => a.id === correctSeason.id)
                  if (!inLib) {
                    await addToLibrary(correctSeason, 'watching')
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('[AniVault] Failed franchise resolution in modal, using original:', err)
        }
      } else if (seasonNum) {
        // Per-season numbering (e.g., OPM S3 E7) - use episode as-is
        console.log(`[AniVault] ✅ Per-season numbering (S${seasonNum} E${episode}), using episode as-is`)
      }

      // Final clamp check
      const finalTotalEpisodes = (anime as any).episodes as number | undefined
      if (finalTotalEpisodes && nextEpisode > finalTotalEpisodes) {
        console.log(`[AniVault] Episode ${nextEpisode} exceeds total ${finalTotalEpisodes}, clamping`)
        nextEpisode = finalTotalEpisodes
      }

      // Update progress and force status to "watching"
      console.log('[AniVault] Updating progress to episode', nextEpisode, 'of', finalTotalEpisodes)
      await updateProgress(anime.id, { progress: nextEpisode, status: 'watching' }, 'desktop')
      setToastMessage(`Matched and updated ${anime.title} to Episode ${nextEpisode}/${finalTotalEpisodes || '?'}`)
      sendPresenceUpdate(anime.title, nextEpisode, finalTotalEpisodes)
      setToastVisible(true)
    } catch (error) {
      console.error('Failed to match anime:', error)
      setToastMessage(`Failed to match anime`)
      setToastVisible(true)
    }
  }

  // A helper function to render the correct view
  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomeDashboard />
      case 'library':
        return <Library />
      case 'discover':
        return <Discover initialQuery={searchQuery} />
      case 'stats':
        return <StatsDashboard />
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <h2 className="text-3xl font-bold mb-6">Settings</h2>
            
            {/* Account Section */}
            <div className="bg-card/60 rounded-xl p-6 border border-border/60 mb-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Account
                {isAuthenticated && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                )}
              </h3>

              {isAuthenticated && user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={user.avatar || 'https://via.placeholder.com/100'}
                      alt={user.username}
                      className="w-12 h-12 rounded-full border border-white/20"
                    />
                    <div>
                      <p className="font-bold text-foreground">{user.username}</p>
                      <p className="text-sm text-muted-foreground">Sync is active</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await logout()
                      } catch (error) {
                        console.error('Logout failed:', error)
                      }
                    }}
                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm max-w-md">
                    Connect your AniList account to sync your library and unlock cloud features.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await login()
                      } catch (error) {
                        console.error('Login failed:', error)
                      }
                    }}
                    className="px-6 py-2.5 bg-violet-600 rounded-lg hover:bg-violet-700 transition-all font-medium shadow-lg shadow-violet-500/20"
                  >
                    Connect AniList
                  </button>
                </div>
              )}
            </div>

            {/* Subscription Section */}
            <div className="bg-card/60 rounded-xl p-6 border border-border/60 mb-6">
              <LicenseSettings />
            </div>

            {/* App Preferences (Placeholder) */}
            <div className="bg-card/60 rounded-xl p-6 border border-border/60">
              <h3 className="text-xl font-semibold mb-4">Application</h3>
              <div className="mb-6">
                <ThemeSelector />
              </div>
              <div className="mb-6 space-y-2">
                <h3 className="text-xl font-semibold">Auto Organizer (Pro)</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically rename and move your downloaded anime into a clean folder structure.
                </p>
                <AutoOrganizerPanel />
              </div>
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Discord Presence Pro+
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                      Pro
                    </span>
                  </h4>
                </div>
                {!isPro && (
                  <p className="text-xs text-muted-foreground">
                    Upgrade to AniVault Pro to unlock advanced Discord Rich Presence.
                  </p>
                )}
                {isPro && (
                  <div className="space-y-3">
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">Enable Discord Presence</span>
                      <input
                        type="checkbox"
                        checked={discordPresenceEnabled}
                        onChange={(e) => {
                          setDiscordPresenceEnabled(e.target.checked)
                          pushPresenceConfig({ enabled: e.target.checked })
                          if (e.target.checked && lastPresenceContext) {
                            sendPresenceUpdate(
                              lastPresenceContext.title,
                              lastPresenceContext.episode,
                              lastPresenceContext.totalEpisodes
                            )
                          }
                        }}
                      />
                    </label>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Presence mode</p>
                      <div className="flex flex-wrap gap-2">
                        {(['minimal', 'stats', 'weeb'] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => {
                              setDiscordPresenceMode(mode)
                              pushPresenceConfig({ mode })
                              if (discordPresenceEnabled && lastPresenceContext) {
                                sendPresenceUpdate(
                                  lastPresenceContext.title,
                                  lastPresenceContext.episode,
                                  lastPresenceContext.totalEpisodes
                                )
                              }
                            }}
                            className={[
                              'rounded-full px-3 py-1 text-xs capitalize transition',
                              discordPresenceMode === mode
                                ? 'bg-primary text-primary-foreground shadow shadow-primary/40'
                                : 'bg-card/60 text-muted-foreground border border-border/60 hover:bg-card hover:text-foreground',
                            ].join(' ')}
                          >
                            {mode === 'minimal' && 'Minimal'}
                            {mode === 'stats' && 'Stats Flex'}
                            {mode === 'weeb' && 'Weeb Mode'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center justify-between gap-4 text-xs">
                      <span className="text-muted-foreground">Show mood label & emoji</span>
                      <input
                        type="checkbox"
                        checked={discordPresenceUseMood}
                        onChange={(e) => {
                          setDiscordPresenceUseMood(e.target.checked)
                          pushPresenceConfig({ useMood: e.target.checked })
                          if (discordPresenceEnabled && lastPresenceContext) {
                            sendPresenceUpdate(
                              lastPresenceContext.title,
                              lastPresenceContext.episode,
                              lastPresenceContext.totalEpisodes
                            )
                          }
                        }}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-4 text-xs">
                      <span className="text-muted-foreground">Show AniList / AniVault buttons</span>
                      <input
                        type="checkbox"
                        checked={discordPresenceShowButtons}
                        onChange={(e) => {
                          setDiscordPresenceShowButtons(e.target.checked)
                          pushPresenceConfig({ showButtons: e.target.checked })
                          if (discordPresenceEnabled && lastPresenceContext) {
                            sendPresenceUpdate(
                              lastPresenceContext.title,
                              lastPresenceContext.episode,
                              lastPresenceContext.totalEpisodes
                            )
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-gray-300">Run at Startup</span>
                  <div className="w-10 h-6 bg-white/10 rounded-full relative">
                    <div className="w-4 h-4 bg-gray-500 rounded-full absolute left-1 top-1"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-gray-300">Minimize to Tray</span>
                  <div className="w-10 h-6 bg-white/10 rounded-full relative">
                    <div className="w-4 h-4 bg-gray-500 rounded-full absolute left-1 top-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <div>Page not found</div>
    }
  }

  // Auth Guard: Show WelcomeScreen if not authenticated and not in guest mode
  if (!isAuthenticated && !isGuest) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
        <TitleBar />
        <WelcomeScreen />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Hero Background Image */}
      {heroImage && (
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.3)',
          }}
        />
      )}

      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/20 via-background/40 to-background" />
      <TitleBar />

      <div className="flex h-[calc(100vh-2rem)] relative z-10">
        {/* Pass state down to Sidebar */}
        <Sidebar activePage={currentPage} onNavigate={handleNavigate} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 backdrop-blur-xl bg-card/40 border-b border-border/60">
            <SearchBar
              value={searchQuery}
              onValueChange={setSearchQuery}
              onSearch={(query) => {
                setSearchQuery(query)
                if (query.trim()) {
                  setCurrentPage('discover')
                }
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage} // This ensures the animation runs when page changes
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Toast Notification for tracking updates */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* Anime Match Modal */}
      {pendingDetection && (
        <AnimeMatchModal
          isOpen={matchModalOpen}
          onClose={() => {
            setMatchModalOpen(false)
            setPendingDetection(null)
          }}
          detectedTitle={pendingDetection.title}
          detectedEpisode={pendingDetection.episode}
          onMatch={handleAnimeMatch}
        />
      )}
    </div>
  )
}

export default Layout
