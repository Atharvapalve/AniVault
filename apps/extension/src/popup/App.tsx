import { useState, useEffect } from 'react'
import type { ExtensionSettings, Platform, EpisodeInfo } from '../types'

interface DetectedAnime extends EpisodeInfo {
  detectedAt: number
  timestamp: string
}

interface PopupState {
  settings: ExtensionSettings | null
  lastDetected: DetectedAnime | null
  recentActivity: DetectedAnime[]
  currentTab: { url?: string; title?: string } | null
  isSupportedSite: boolean
  isLoading: boolean
}

function App() {
  const [state, setState] = useState<PopupState>({
    settings: null,
    lastDetected: null,
    recentActivity: [],
    currentTab: null,
    isSupportedSite: false,
    isLoading: true,
  })

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const currentTab = tab ? { url: tab.url, title: tab.title } : null
        const isSupportedSite =
          currentTab?.url?.includes('crunchyroll.com') ||
          currentTab?.url?.includes('netflix.com') ||
          /zoro|aniwatch|hianime|zorox|9anime|aniwave|gogoanime|animepahe/i.test(currentTab?.url || '') ||
          false

        // Get settings, lastDetected, and recentActivity
        const storage = await chrome.storage.local.get([
          'settings',
          'lastDetected',
          'recentActivity',
        ])
        const settings: ExtensionSettings = storage.settings || {
          autoTrack: true,
          lastSeenVersion: '0.1.0',
        }
        const lastDetected: DetectedAnime | null = storage.lastDetected || null
        const recentActivity: DetectedAnime[] = storage.recentActivity || []

        setState({
          settings,
          lastDetected,
          recentActivity,
          currentTab,
          isSupportedSite,
          isLoading: false,
        })
      } catch (error) {
        console.error('[AniVault] Error loading popup data:', error)
        setState((prev) => ({ ...prev, isLoading: false }))
      }
    }

    loadData()

    // Listen for storage changes
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange
    }) => {
      if (changes.lastDetected) {
        const lastDetected = changes.lastDetected.newValue as DetectedAnime | null
        setState((prev) => ({ ...prev, lastDetected }))
      }
      if (changes.recentActivity) {
        const recentActivity = (changes.recentActivity.newValue as DetectedAnime[]) || []
        setState((prev) => ({ ...prev, recentActivity }))
      }
      if (changes.settings) {
        const settings = changes.settings.newValue as ExtensionSettings
        setState((prev) => ({ ...prev, settings }))
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const toggleAutoTrack = async () => {
    if (!state.settings) return

    const newSettings: ExtensionSettings = {
      ...state.settings,
      autoTrack: !state.settings.autoTrack,
    }

    await chrome.storage.local.set({ settings: newSettings })
    setState((prev) => ({ ...prev, settings: newSettings }))
  }

  const formatTimeAgo = (timestamp: number | string): string => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const formatStatus = (episode: DetectedAnime | null): string => {
    if (!episode) return 'No anime detected on this tab'

    const parts: string[] = [episode.title]

    if (episode.overallEpisode != null) {
      parts.push(`Episode ${episode.overallEpisode}`)
    } else if (episode.seasonNumber != null && episode.seasonEpisode != null) {
      parts.push(`Season ${episode.seasonNumber} · Ep ${episode.seasonEpisode}`)
    }

    return parts.join(' — ')
  }

  const formatEpisodeInfo = (entry: DetectedAnime): string => {
    if (entry.overallEpisode != null) {
      return `Episode ${entry.overallEpisode}`
    } else if (entry.seasonNumber != null && entry.seasonEpisode != null) {
      return `Season ${entry.seasonNumber} · Ep ${entry.seasonEpisode}`
    }
    return 'Episode unknown'
  }

  const getPlatformName = (platform: Platform): string => {
    switch (platform) {
      case 'crunchyroll':
        return 'Crunchyroll'
      case 'netflix':
        return 'Netflix'
      case 'zoro':
        return 'Zoro/AniWatch'
      case 'nineanime':
        return '9anime'
      case 'animepahe':
        return 'AnimePahe'
      case 'generic':
        return 'anime site'
      default:
        return platform
    }
  }

  const getPlatformIcon = (platform: string): string => {
    switch (platform) {
      case 'crunchyroll':
        return '🎌'
      case 'netflix':
        return '🎬'
      case 'zoro':
        return '⚔️'
      case 'nineanime':
        return '9️⃣'
      case 'animepahe':
        return '📺'
      case 'generic':
        return '📺'
      default:
        return '📺'
    }
  }

  if (state.isLoading) {
    return (
      <div className="w-[380px] min-h-[400px] bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-[380px] min-h-[400px] bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white">
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AV</span>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold">AniVault Extension</h1>
            <p className="text-xs text-gray-400">Auto-track your anime</p>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="p-6 space-y-4">
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Status</h2>
            <div
              className={`w-2 h-2 rounded-full ${
                state.lastDetected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
              }`}
            />
          </div>
          <div className="text-sm text-gray-400">
            {state.lastDetected ? (
              <div>
                <div className="text-white font-medium mb-1">
                  Watching on {getPlatformName(state.lastDetected.platform)}
                </div>
                <div className="text-xs text-white font-semibold">
                  {formatStatus(state.lastDetected)}
                </div>
                <div className="text-xs mt-1">
                  {state.settings?.autoTrack
                    ? 'Auto-tracking is active'
                    : 'Auto-tracking is disabled'}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-gray-500">No anime detected</div>
                <div className="text-xs mt-1">
                  Visit a supported anime streaming site to start tracking
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Toggle */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Auto-track streaming sites</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Automatically detect and track episodes
              </div>
            </div>
            <button
              onClick={toggleAutoTrack}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                state.settings?.autoTrack ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  state.settings?.autoTrack ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Recent Activity</h2>
          {state.recentActivity.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              No activity yet
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {state.recentActivity.map((entry, index) => (
                <div
                  key={`${entry.title}-${entry.overallEpisode ?? entry.seasonEpisode}-${entry.detectedAt}-${index}`}
                  className="flex flex-col gap-0.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white truncate flex-1">
                      {entry.title}
                    </span>
                    <span className="text-[10px] uppercase text-gray-500 ml-2 shrink-0">
                      {entry.platform}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-gray-400">
                    <span>{formatEpisodeInfo(entry)}</span>
                    <span>{formatTimeAgo(entry.detectedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              chrome.tabs.create({ url: 'https://anivault.app' })
            }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Open AniVault Desktop to see full stats & library →
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
