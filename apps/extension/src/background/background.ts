// Background service worker for AniVault Extension
import type {
  ExtensionEpisodeEvent,
  EpisodeCompleteEvent,
  LastWatchedEntry,
  ExtensionSettings,
  ExtensionStorage,
} from '../types'
import { DESKTOP_APP_URL, DESKTOP_APP_CLEAR_URL } from '../types'

const STORAGE_KEYS = {
  SETTINGS: 'settings',
  LAST_WATCHED: 'lastWatched',
  PENDING_SYNC: 'pendingSync',
} as const

const MAX_LAST_WATCHED = 20

/**
 * Initialize default settings on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[AniVault] Extension installed/updated:', details.reason)

  // Initialize default settings
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS)
  if (!result.settings) {
    const defaultSettings: ExtensionSettings = {
      autoTrack: true,
      lastSeenVersion: chrome.runtime.getManifest().version,
    }
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: defaultSettings })
  }

  // Initialize lastWatched if it doesn't exist
  const watchedResult = await chrome.storage.local.get(STORAGE_KEYS.LAST_WATCHED)
  if (!watchedResult.lastWatched) {
    await chrome.storage.local.set({ [STORAGE_KEYS.LAST_WATCHED]: [] })
  }
})

/**
 * Send episode completion event to Desktop app
 */
async function sendToDesktop(event: ExtensionEpisodeEvent): Promise<boolean> {
  try {
    const response = await fetch(DESKTOP_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    if (response.ok) {
      console.log('[AniVault] Successfully sent event to desktop app')
      return true
    }
  } catch (error) {
    // Silently ignore - desktop app might not be running
  }

  return false
}

/**
 * Notify desktop app that detection was cleared
 */
async function notifyDesktopClear(): Promise<void> {
  try {
    await fetch(DESKTOP_APP_CLEAR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    // Silently ignore - desktop app might not be running
  }
}

/**
 * Handle episode completion event
 */
async function handleEpisodeCompleted(event: ExtensionEpisodeEvent): Promise<void> {
  // Update recentActivity (dedup by platform+title+episode)
  const result = await chrome.storage.local.get(['recentActivity'])
  const current: ExtensionEpisodeEvent[] = result.recentActivity || []

  const key = `${event.platform}::${event.title}::${event.overallEpisode ?? event.seasonEpisode ?? 'na'}`

  const filtered = current.filter((entry) => {
    const entryKey = `${entry.platform}::${entry.title}::${entry.overallEpisode ?? entry.seasonEpisode ?? 'na'}`
    return entryKey !== key
  })

  const updated = [event, ...filtered].slice(0, 10)
  await chrome.storage.local.set({ recentActivity: updated })

  // Send to desktop
  await sendToDesktop(event)
}

/**
 * Store episode completion event
 */
async function storeLastWatched(entry: LastWatchedEntry): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.LAST_WATCHED)
  const lastWatched: LastWatchedEntry[] = result.lastWatched || []

  // Add to beginning
  lastWatched.unshift(entry)

  // Keep only last MAX_LAST_WATCHED entries
  if (lastWatched.length > MAX_LAST_WATCHED) {
    lastWatched.splice(MAX_LAST_WATCHED)
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.LAST_WATCHED]: lastWatched })
}

/**
 * Add event to pending sync queue
 */
async function addToPendingSync(event: EpisodeCompleteEvent['data']): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_SYNC)
  const pendingSync: EpisodeCompleteEvent['data'][] = result.pendingSync || []

  // Check if already in queue (deduplicate by title + episode + season)
  const episodeNum = event.overallEpisode ?? event.seasonEpisode ?? 'na'
  const seasonNum = event.seasonNumber ?? 'na'
  const key = `${event.title}-${episodeNum}-${seasonNum}`
  const exists = pendingSync.some((e) => {
    const eEpisodeNum = e.overallEpisode ?? e.seasonEpisode ?? 'na'
    const eSeasonNum = e.seasonNumber ?? 'na'
    return `${e.title}-${eEpisodeNum}-${eSeasonNum}` === key
  })

  if (!exists) {
    pendingSync.push(event)
    await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_SYNC]: pendingSync })
  }
}

/**
 * Remove event from pending sync queue
 */
async function removeFromPendingSync(event: EpisodeCompleteEvent['data']): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_SYNC)
  const pendingSync: EpisodeCompleteEvent['data'][] = result.pendingSync || []

  const episodeNum = event.overallEpisode ?? event.seasonEpisode ?? 'na'
  const seasonNum = event.seasonNumber ?? 'na'
  const key = `${event.title}-${episodeNum}-${seasonNum}`
  const filtered = pendingSync.filter((e) => {
    const eEpisodeNum = e.overallEpisode ?? e.seasonEpisode ?? 'na'
    const eSeasonNum = e.seasonNumber ?? 'na'
    return `${e.title}-${eEpisodeNum}-${eSeasonNum}` !== key
  })

  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_SYNC]: filtered })
}

/**
 * Process pending sync queue
 */
async function processPendingSync(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_SYNC)
  const pendingSync: EpisodeCompleteEvent['data'][] = result.pendingSync || []

  if (pendingSync.length === 0) {
    return
  }

  const successful: EpisodeCompleteEvent['data'][] = []

  for (const event of pendingSync) {
    const success = await sendToDesktop(event)
    if (success) {
      successful.push(event)
    }
  }

  // Remove successfully synced events
  if (successful.length > 0) {
    const remaining = pendingSync.filter((e) => {
      const eEpisodeNum = e.overallEpisode ?? e.seasonEpisode ?? 'na'
      const eSeasonNum = e.seasonNumber ?? 'na'
      return !successful.some((s) => {
        const sEpisodeNum = s.overallEpisode ?? s.seasonEpisode ?? 'na'
        const sSeasonNum = s.seasonNumber ?? 'na'
        return `${s.title}-${sEpisodeNum}-${sSeasonNum}` === `${e.title}-${eEpisodeNum}-${eSeasonNum}`
      })
    })
    await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_SYNC]: remaining })
  }
}

/**
 * Normalize title by removing site clutter
 */
function normalizeTitle(title: string): string {
  return title
    .split('|')[0]
    .split('-')[0]
    .replace(/episode.*$/i, '')
    .replace(/ep\s*\d+.*$/i, '')
    .trim()
}

/**
 * Generate a unique key for an episode detection (for deduplication)
 */
function getEpisodeKey(episode: {
  platform: string
  title: string
  overallEpisode: number | null
  seasonEpisode: number | null
}): string {
  const episodeNum = episode.overallEpisode ?? episode.seasonEpisode ?? 'na'
  return `${episode.platform}::${episode.title}::${episodeNum}`
}

/**
 * Handle anime detection messages from content scripts
 */
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
  // Handle ANIVAULT_ANIME_DETECTED (detection, not completion)
  if (message.type === 'ANIVAULT_ANIME_DETECTED') {
    const detection = message.data as Omit<ExtensionEpisodeEvent, 'watchedSeconds' | 'durationSeconds' | 'progress' | 'completedAt'>

    // Process asynchronously
    ;(async () => {
      try {
        // Save lastDetected
        await chrome.storage.local.set({ lastDetected: detection })
        console.debug('[AniVault] BG: detection stored', detection)

        sendResponse({ ok: true })
      } catch (error) {
        console.error('[AniVault] Error processing anime detection:', error)
        sendResponse({ ok: false, error: String(error) })
      }
    })()

    return true // Keep message channel open for async response
  }

  // Handle ANIVAULT_CLEAR_DETECTION (clear status when not watching)
  if (message.type === 'ANIVAULT_CLEAR_DETECTION') {
    // Process asynchronously
    ;(async () => {
      try {
        // Clear lastDetected
        await chrome.storage.local.set({ lastDetected: null })

        // Notify desktop app to clear Discord presence
        await notifyDesktopClear()

        sendResponse({ ok: true })
      } catch (error) {
        console.error('[AniVault] Error clearing detection:', error)
        sendResponse({ ok: false, error: String(error) })
      }
    })()

    return true // Keep message channel open for async response
  }

  // Handle ANIVAULT_EPISODE_COMPLETED
  if (message.type === 'ANIVAULT_EPISODE_COMPLETED') {
    const event = message.data as ExtensionEpisodeEvent

    // Process asynchronously
    ;(async () => {
      try {
        await handleEpisodeCompleted(event)
        sendResponse({ ok: true })
      } catch (error) {
        console.error('[AniVault] Error processing episode completion:', error)
        sendResponse({ ok: false, error: String(error) })
      }
    })()

    return true // Keep message channel open for async response
  }

  // Legacy handler for ANIME_DETECTED (backward compatibility)
  if (message.type === 'ANIME_DETECTED') {
    const episodeInfo = {
      ...message.data,
      detectedAt: Date.now(),
      timestamp: new Date().toISOString(),
    }

    // Normalize title
    const normalizedTitle = normalizeTitle(episodeInfo.title)
    const normalizedData = {
      ...episodeInfo,
      title: normalizedTitle,
    }

    // Process asynchronously
    ;(async () => {
      try {
        // Save lastDetected
        await chrome.storage.local.set({ lastDetected: normalizedData })

        // Update recentActivity with deduplication
        const result = await chrome.storage.local.get(['recentActivity'])
        const current: typeof normalizedData[] = result.recentActivity || []

        // Generate key for this episode
        const key = getEpisodeKey(normalizedData)

        // Remove existing items with same key
        const filtered = current.filter((entry) => {
          const entryKey = getEpisodeKey(entry)
          return entryKey !== key
        })

        // Add new entry at the top and keep max 10
        const updated = [normalizedData, ...filtered].slice(0, 10)
        await chrome.storage.local.set({ recentActivity: updated })
    
        // Send to desktop (ignore failures)
        fetch('http://localhost:35847/extension-event', {
          method: 'POST',
          body: JSON.stringify(normalizedData),
          headers: { 'Content-Type': 'application/json' },
        }).catch(() => {
          // Silently ignore failures
        })

        sendResponse({ ok: true })
      } catch (error) {
        console.error('[AniVault] Error processing anime detection:', error)
        sendResponse({ ok: false, error: String(error) })
      }
    })()

    return true // Keep message channel open for async response
  }

  // Handle ANIVault_EPISODE_COMPLETE (episode completion)
  if (message.type === 'ANIVault_EPISODE_COMPLETE') {
    const event = message.data

    // Process asynchronously
    ;(async () => {
      try {
        // Store in last watched
        const lastWatchedEntry: LastWatchedEntry = {
          platform: event.platform,
          title: event.title,
          episode: event.overallEpisode ?? event.seasonEpisode ?? null,
          season: event.seasonNumber ?? undefined,
          url: event.url,
          completedAt: event.completedAt,
        }

        await storeLastWatched(lastWatchedEntry)

        // Send to desktop (already handled by handleEpisodeCompleted)
    
    sendResponse({ success: true })
      } catch (error) {
        console.error('[AniVault] Error processing episode completion:', error)
        sendResponse({ success: false, error: String(error) })
  }
    })()
  
  return true // Keep message channel open for async response
  }

  return false
})

/**
 * Periodically try to sync pending events
 */
chrome.alarms.create('syncPendingEvents', { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncPendingEvents') {
    processPendingSync()
  }
})

/**
 * Track tab updates to detect streaming sites
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('crunchyroll.com') || tab.url.includes('netflix.com')) {
      console.log('[AniVault] Streaming site detected:', tab.url)
    }
  }
})

/**
 * Clear detection when tab is closed
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // Check if any tabs with streaming sites are still open
  const tabs = await chrome.tabs.query({})
  const hasStreamingTab = tabs.some((tab) => {
    const url = tab.url || ''
    return (
      url.includes('crunchyroll.com') ||
      url.includes('netflix.com') ||
      url.includes('zoro') ||
      url.includes('animepahe') ||
      url.includes('9anime')
    )
  })

  // If no streaming tabs remain, clear detection
  if (!hasStreamingTab) {
    await chrome.storage.local.set({ lastDetected: null })
  }
})
