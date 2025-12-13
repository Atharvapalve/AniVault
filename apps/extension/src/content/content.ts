// Content script for AniVault Extension
import { getActiveAdapter, findVideoElement } from './adapters'
import type { SiteAdapter } from './adapters'
import type { EpisodeInfo, ExtensionEpisodeEvent } from '../types'

console.log('[AniVault] ========== Content script loaded ==========')

let currentTracker: EpisodeTracker | null = null
let lastUrl = location.href
let lastDetectionKey: string | null = null

/**
 * Episode tracker that monitors video playback
 */
class EpisodeTracker {
  private video: HTMLVideoElement
  private detection: EpisodeInfo
  private hasSentComplete = false
  private timeUpdateHandler: (() => void) | null = null
  private endedHandler: (() => void) | null = null

  constructor(video: HTMLVideoElement, detection: EpisodeInfo) {
    this.video = video
    this.detection = detection
    console.log('[AniVault] EpisodeTracker created for:', detection.title, 'Ep', detection.overallEpisode)
  }

  start(): void {
    if (this.timeUpdateHandler || this.endedHandler) {
      console.log('[AniVault] Tracker already started, skipping')
      return
    }

    console.log('[AniVault] Starting tracker...')

    this.timeUpdateHandler = () => {
      const watchedSeconds = this.video.currentTime
      const durationSeconds = this.video.duration || 0
      const progress = durationSeconds > 0 ? watchedSeconds / durationSeconds : 0

      if (!this.hasSentComplete && progress >= 0.8) {
        this.hasSentComplete = true
        console.log('[AniVault] ✅ Progress >= 80%! Sending completion:', {
          title: this.detection.title,
          episode: this.detection.overallEpisode,
          progress: (progress * 100).toFixed(1) + '%',
          watchedSeconds,
          durationSeconds
        })
        this.sendEpisodeCompleted(watchedSeconds, durationSeconds)
      }
    }

    this.endedHandler = () => {
      if (!this.hasSentComplete) {
        const watchedSeconds = this.video.currentTime
        const durationSeconds = this.video.duration || 0
        console.log('[AniVault] ✅ Video ended! Sending completion:', {
          title: this.detection.title,
          episode: this.detection.overallEpisode,
          watchedSeconds,
          durationSeconds
        })
        this.sendEpisodeCompleted(watchedSeconds, durationSeconds)
        this.hasSentComplete = true
      }
    }

    this.video.addEventListener('timeupdate', this.timeUpdateHandler, { passive: true })
    this.video.addEventListener('ended', this.endedHandler, { passive: true })
    console.log('[AniVault] Tracker started, listeners attached')
  }

  stop(): void {
    console.log('[AniVault] Stopping tracker...')
    if (this.timeUpdateHandler) {
      this.video.removeEventListener('timeupdate', this.timeUpdateHandler)
      this.timeUpdateHandler = null
    }
    if (this.endedHandler) {
      this.video.removeEventListener('ended', this.endedHandler)
      this.endedHandler = null
    }
  }

  private sendEpisodeCompleted(watchedSeconds: number, durationSeconds: number): void {
    const event: ExtensionEpisodeEvent = {
      ...this.detection,
      watchedSeconds,
      durationSeconds,
      progress: durationSeconds > 0 ? watchedSeconds / durationSeconds : 0,
      completedAt: new Date().toISOString(),
    }

    console.log('[AniVault] 📤 Sending EPISODE_COMPLETED to background:', event)

    chrome.runtime.sendMessage({
      type: 'ANIVAULT_EPISODE_COMPLETED',
      data: event,
    }).catch((error) => {
      console.error('[AniVault] ❌ Failed to send completion event:', error)
    })
  }

  updateDetection(detection: EpisodeInfo): void {
    const currentKey = `${this.detection.title}-${this.detection.overallEpisode ?? this.detection.seasonEpisode ?? 'na'}`
    const newKey = `${detection.title}-${detection.overallEpisode ?? detection.seasonEpisode ?? 'na'}`
    
    if (currentKey !== newKey) {
      console.log('[AniVault] Episode changed, resetting tracker:', currentKey, '→', newKey)
      this.stop()
      this.detection = detection
      this.hasSentComplete = false
      this.start()
      }
    }
  }

/**
 * Main detection function - runs periodically
 */
async function runDetection(): Promise<void> {
  try {
    const isTopFrame = window.self === window.top
    console.log('[AniVault] 🔍 Running detection on:', window.location.href, isTopFrame ? '(main frame)' : '(iframe)')

    const adapter = getActiveAdapter(window.location.href)
    console.log('[AniVault] Adapter selected:', adapter.id)

    const detection = adapter.detectEpisode()
    console.log('[AniVault] Detection result:', detection)

    // Main frame: detect and store
    if (isTopFrame && detection) {
      // Generate detection key for deduplication
      const detectionKey = `${detection.title}-${detection.overallEpisode ?? detection.seasonEpisode ?? 'na'}`
      
      // Store detection in chrome.storage for iframe to use
      await chrome.storage.local.set({ currentDetection: detection })
      console.log('[AniVault] 💾 Stored detection for iframe:', detection)
      
      // Always send detection to background (for popup status)
      console.log('[AniVault] 📤 Sending ANIME_DETECTED to background:', detection)
      chrome.runtime
        .sendMessage({
          type: 'ANIVAULT_ANIME_DETECTED',
          data: detection,
        })
        .catch((error) => {
          console.error('[AniVault] ❌ Failed to send detection message:', error)
        })

      // If this is a different episode than last time, stop old tracker
      if (lastDetectionKey && lastDetectionKey !== detectionKey) {
        console.log('[AniVault] Episode changed, stopping old tracker')
        if (currentTracker) {
          currentTracker.stop()
          currentTracker = null
        }
      }
      lastDetectionKey = detectionKey
}

    // Both frames: try to find video and start tracker
    const video = findVideoElement()
    console.log('[AniVault] Video element:', video ? 'found' : 'not found', video ? `(duration: ${video.duration})` : '')

    if (video) {
      // Check if video has duration
      let hasDuration = false
      try {
        hasDuration = !!(video.duration && video.duration > 0 && !isNaN(video.duration))
      } catch {
        hasDuration = false
      }

      if (hasDuration) {
        // Get detection - always prefer storage for iframes or if detection is invalid
        let trackingDetection = detection
        
        // If we're in an iframe OR detection is invalid (like "Vilos"), read from storage
        const isInvalidDetection = !detection || 
          !detection.overallEpisode || 
          detection.title === 'Vilos' ||
          detection.title.length < 3
        
        if (!isTopFrame || isInvalidDetection) {
          console.log('[AniVault] Reading detection from storage (iframe or invalid detection)...')
          const stored = await chrome.storage.local.get('currentDetection')
          trackingDetection = stored.currentDetection
          console.log('[AniVault] Retrieved detection from storage:', trackingDetection)
        }

        if (trackingDetection && trackingDetection.overallEpisode) {
          // Create or update tracker
          if (!currentTracker) {
            console.log('[AniVault] ✅ Creating new tracker with:', trackingDetection.title, 'Ep', trackingDetection.overallEpisode)
            currentTracker = new EpisodeTracker(video, trackingDetection)
            currentTracker.start()
          } else {
            console.log('[AniVault] ✅ Updating existing tracker with:', trackingDetection.title, 'Ep', trackingDetection.overallEpisode)
            currentTracker.updateDetection(trackingDetection)
          }
        } else {
          console.log('[AniVault] ⚠️ No valid detection available to start tracker')
        }
      } else {
        console.log('[AniVault] Video found but duration not ready yet, will retry...')
      }
    } else {
      if (!isTopFrame) {
        console.log('[AniVault] (iframe) No video element found yet, will retry...')
}
    }
  } catch (error) {
    console.error('[AniVault] ❌ Error in runDetection:', error)
  }
}

/**
 * Clear detection (only on navigation away or tab close)
 */
function clearDetection(): void {
  console.log('[AniVault] 🧹 Clearing detection')
  if (currentTracker) {
    currentTracker.stop()
    currentTracker = null
  }
  lastDetectionKey = null
  chrome.runtime
    .sendMessage({ type: 'ANIVAULT_CLEAR_DETECTION' })
    .catch(() => {})
}

// Run detection on page load
console.log('[AniVault] Initial detection run...')
setTimeout(() => runDetection(), 500)

// Re-run detection every 2 seconds to handle dynamic content
setInterval(() => {
  const currentUrl = location.href
  
  // If URL changed, clear old detection and run new
  if (currentUrl !== lastUrl) {
    console.log('[AniVault] URL changed:', lastUrl, '→', currentUrl)
    clearDetection()
    lastUrl = currentUrl
    setTimeout(() => runDetection(), 500)
  } else {
    // Same URL, just re-run detection (will handle video loading, etc.)
    runDetection()
  }
}, 2000)

// Clear detection only when tab is closed or navigated away
window.addEventListener('beforeunload', () => {
  console.log('[AniVault] Page unloading, clearing detection')
  clearDetection()
})
console.log('[AniVault] ========== Setup complete ==========')

