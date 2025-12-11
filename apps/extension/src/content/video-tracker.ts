import type { EpisodeInfo, EpisodeCompleteEvent, PlaybackState } from '../types'

/**
 * Track video playback and send completion events
 */
export class VideoTracker {
  private video: HTMLVideoElement | null = null
  private detection: EpisodeInfo | null = null
  private state: PlaybackState = {
    lastProgress: 0,
    hasSentComplete: false,
    lastEpisodeKey: null,
  }
  private timeUpdateHandler: (() => void) | null = null
  private endedHandler: (() => void) | null = null
  private isTracking = false

  constructor(detection: EpisodeInfo) {
    this.detection = detection
    this.state.lastEpisodeKey = this.getEpisodeKey(detection)
  }

  private getEpisodeKey(detection: EpisodeInfo): string {
    const episode = detection.overallEpisode ?? detection.seasonEpisode ?? 'null'
    const season = detection.seasonNumber ?? 'null'
    return `${detection.title}-${episode}-${season}`
  }

  /**
   * Start tracking video playback
   */
  public start(): void {
    if (this.isTracking) {
      return
    }

    // Find video element
    this.video = document.querySelector('video')

    if (!this.video) {
      // Video might not be loaded yet, try again after a delay
      setTimeout(() => {
        this.video = document.querySelector('video')
        if (this.video) {
          this.attachListeners()
        }
      }, 1000)
      return
    }

    this.attachListeners()
  }

  /**
   * Stop tracking and cleanup
   */
  public stop(): void {
    if (!this.video || !this.isTracking) {
      return
    }

    if (this.timeUpdateHandler) {
      this.video.removeEventListener('timeupdate', this.timeUpdateHandler)
    }

    if (this.endedHandler) {
      this.video.removeEventListener('ended', this.endedHandler)
    }

    this.isTracking = false
    this.video = null
  }

  private attachListeners(): void {
    if (!this.video || !this.detection) {
      return
    }

    this.isTracking = true

    // Time update handler - check progress
    this.timeUpdateHandler = () => {
      if (!this.video || !this.detection) {
        return
      }

      const watchedSeconds = this.video.currentTime
      const durationSeconds = this.video.duration || 0

      if (durationSeconds === 0) {
        return
      }

      const progress = watchedSeconds / durationSeconds
      this.state.lastProgress = progress

      // Send completion event if >= 80% watched and not already sent
      if (progress >= 0.8 && !this.state.hasSentComplete) {
        this.sendCompletionEvent(watchedSeconds, durationSeconds, progress)
      }
    }

    // Ended handler - video finished
    this.endedHandler = () => {
      if (!this.video || !this.detection || this.state.hasSentComplete) {
        return
      }

      const watchedSeconds = this.video.currentTime
      const durationSeconds = this.video.duration || 0
      const progress = durationSeconds > 0 ? watchedSeconds / durationSeconds : 1

      this.sendCompletionEvent(watchedSeconds, durationSeconds, progress)
    }

    this.video.addEventListener('timeupdate', this.timeUpdateHandler, { passive: true })
    this.video.addEventListener('ended', this.endedHandler, { passive: true })
  }

  private sendCompletionEvent(
    watchedSeconds: number,
    durationSeconds: number,
    progress: number
  ): void {
    if (!this.detection || this.state.hasSentComplete) {
      return
    }

    // Mark as sent to prevent duplicates
    this.state.hasSentComplete = true

    // Create completion event with proper structure
    const event: EpisodeCompleteEvent = {
      type: 'ANIVault_EPISODE_COMPLETE',
      data: {
        platform: this.detection.platform,
        title: this.detection.title,
        overallEpisode: this.detection.overallEpisode,
        seasonNumber: this.detection.seasonNumber,
        seasonEpisode: this.detection.seasonEpisode,
        url: this.detection.url,
        watchedSeconds,
        durationSeconds,
        progress,
        completedAt: new Date().toISOString(),
      },
    }

    // Send to background script
    chrome.runtime.sendMessage(event).catch((error) => {
      console.error('[AniVault] Failed to send completion event:', error)
    })
  }

  /**
   * Update detection (e.g., when navigating to a new episode)
   */
  public updateDetection(detection: EpisodeInfo): void {
    const newKey = this.getEpisodeKey(detection)

    // If it's a different episode, reset state
    if (newKey !== this.state.lastEpisodeKey) {
      this.stop()
      this.detection = detection
      this.state = {
        lastProgress: 0,
        hasSentComplete: false,
        lastEpisodeKey: newKey,
      }
      this.start()
    }
  }
}

