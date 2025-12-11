import type { EpisodeInfo, Platform } from '../types'

/**
 * Site Adapter interface for modular site detection
 */
export interface SiteAdapter {
  id: Platform
  match: (url: string) => boolean
  detectEpisode: () => EpisodeInfo | null
  findVideoElement: () => HTMLVideoElement | null
}

// Universal findVideoElement helper (normal DOM + shadow DOM)
export function findVideoElement(): HTMLVideoElement | null {
  const direct = document.querySelector('video')
  if (direct) return direct as HTMLVideoElement
  const all = Array.from(document.querySelectorAll('*'))
  for (const el of all) {
    const shadow = (el as HTMLElement).shadowRoot
    if (!shadow) continue
    const v = shadow.querySelector('video')
    if (v) return v as HTMLVideoElement
  }
  return null
}

/**
 * Crunchyroll adapter with improved detection
 */
export const crunchyrollAdapter: SiteAdapter = {
  id: 'crunchyroll',
  match: (url) => /crunchyroll\.com/.test(url),
  detectEpisode: () => {
    try {
      console.log('[AniVault] Crunchyroll detectEpisode running...')
      const url = window.location.href

      // 1. Get show title (the h4 with anime name)
      const showTitleSelectors = [
        'h4.text--gq6o-',
        '[data-testid="content-title"]',
        '[data-testid="hero-title-block-title"]',
        '[data-testid="show-title"]',
      ]

      let showTitle = ''
      for (const sel of showTitleSelectors) {
        const el = document.querySelector(sel)
        const text = el?.textContent?.trim()
        console.log(`[AniVault CR] Checking "${sel}":`, text || 'not found')
        if (text && text.length > 2 && !/^E\d+$/i.test(text)) {
          showTitle = text
          break
        }
      }

      console.log('[AniVault CR] Show title result:', showTitle)

      // Fallback to og:title or document.title
      if (!showTitle) {
        const og = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || ''
        let cleaned = og || document.title || ''
        console.log('[AniVault CR] Fallback title:', cleaned)

        cleaned = cleaned
          .replace(/Episode\s+\d+.*$/i, '')
          .replace(/-\s*Watch on Crunchyroll.*/i, '')
          .replace(/-\s*Crunchyroll.*/i, '')
          .replace(/Crunchyroll.*/i, '')
          .trim()

        showTitle = cleaned
        console.log('[AniVault CR] Cleaned fallback:', showTitle)
      }

      // Ignore generic/empty titles
      if (!showTitle || showTitle === 'Crunchyroll' || /Watch Popular Anime/i.test(showTitle)) {
        console.log('[AniVault CR] ❌ Invalid/generic title, returning null')
        return null
      }

      // 2. Get episode number from the episode heading (h1.title)
      // Example: "E2 - The Assassin Takes Care of the Wounded"
      const episodeHeading = document.querySelector('h1.title')?.textContent?.trim() || ''
      console.log('[AniVault CR] Episode heading:', episodeHeading)

      let overallEpisode: number | null = null
      let seasonNumber: number | null = null
      let seasonEpisode: number | null = null

      // Parse episode from heading like "E39 - ..." or "Episode 39 - ..."
      const epMatch = episodeHeading.match(/^E(\d{1,4})\b/i) || episodeHeading.match(/Episode\s+(\d{1,4})/i)
      if (epMatch?.[1]) {
        const n = parseInt(epMatch[1], 10)
        if (!isNaN(n)) {
          overallEpisode = n
          console.log('[AniVault CR] Parsed episode number:', overallEpisode)
        }
      }

      // Also check for season info in context
      const metaTextPieces: string[] = [document.title, episodeHeading]
      document.querySelectorAll('[data-testid*="episode"], [class*="season"]').forEach((el) => {
        const text = el.textContent?.trim()
        if (text) metaTextPieces.push(text)
      })

      const context = metaTextPieces.filter(Boolean).join(' • ')
      console.log('[AniVault CR] Context for parsing:', context)

      const seasonMatch = context.match(/Season\s+(\d{1,2})/i) || context.match(/\bS(\d{1,2})\b/i)
      if (seasonMatch?.[1]) {
        const s = parseInt(seasonMatch[1], 10)
        if (!isNaN(s)) {
          seasonNumber = s
          console.log('[AniVault CR] Found season:', seasonNumber)
        }
      }

      console.log('[AniVault CR] ✅ Returning detection:', {
        platform: 'crunchyroll',
        title: showTitle,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url
      })

      return {
        platform: 'crunchyroll',
        title: showTitle,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url,
      }
    } catch (error) {
      console.error('[AniVault CR] ❌ Detection error:', error)
      return null
    }
  },
  findVideoElement,
}

/**
 * Netflix adapter with improved detection
 * Prioritizes the video-title UI element structure
 */
export const netflixAdapter: SiteAdapter = {
  id: 'netflix',
  match: (url) => /netflix\.com/.test(url),
  detectEpisode: () => {
    try {
      console.log('[AniVault] Netflix detectEpisode running...')
      const url = window.location.href

      let rawTitle = ''
      let overallEpisode: number | null = null
      let seasonNumber: number | null = null
      let seasonEpisode: number | null = null

      // Priority 1: Try the video-title UI element
      // Structure: <div data-uia="video-title"><h4>TITLE</h4><span>E30</span><span>Episode Name</span></div>
      const videoTitleEl = document.querySelector('[data-uia="video-title"]')
      if (videoTitleEl) {
        const h4 = videoTitleEl.querySelector('h4')
        const spans = videoTitleEl.querySelectorAll('span')
        
        if (h4) {
          rawTitle = h4.textContent?.trim() || ''
          console.log('[AniVault NF] Found title from video-title:', rawTitle)
        }

        // First span usually contains episode number (e.g., "E30")
        if (spans[0]) {
          const episodeText = spans[0].textContent?.trim() || ''
          const eMatch = episodeText.match(/E(\d{1,4})/i)
          if (eMatch?.[1]) {
            overallEpisode = parseInt(eMatch[1], 10)
            console.log('[AniVault NF] Found episode from span:', overallEpisode)
          }
        }
      }

      // Fallback to og:title / document.title if video-title element not found
      if (!rawTitle || !overallEpisode) {
        console.log('[AniVault NF] Falling back to og:title / document.title')
        const og = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || ''
        let base = og || document.title || ''
        console.log('[AniVault NF] og:title / document.title:', base)

        const eMatch = base.match(/\bE(\d{1,4})\b/i)
        if (eMatch?.[1] && !overallEpisode) {
          overallEpisode = parseInt(eMatch[1], 10)
          console.log('[AniVault NF] Parsed episode from fallback:', overallEpisode)
        }

        if (!rawTitle) {
          rawTitle = base
            .replace(/-?\s*Netflix.*/i, '')
            .replace(/:\s*E\d{1,4}.*/i, '')
            .replace(/Episode\s+\d+.*/i, '')
            .trim()
          console.log('[AniVault NF] Cleaned title from fallback:', rawTitle)
        }
      }

      // Validate title
      if (!rawTitle || rawTitle.length < 2) {
        console.log('[AniVault NF] ❌ No valid title')
        return null
      }

      // Try to extract season number from title or context
      const titleLower = rawTitle.toLowerCase()
      const seasonMatch = titleLower.match(/season\s+(\d{1,2})/i) || 
                          titleLower.match(/\bs(\d{1,2})\b/i) ||
                          titleLower.match(/part\s+(\d{1,2})/i)
      
      if (seasonMatch?.[1]) {
        seasonNumber = parseInt(seasonMatch[1], 10)
        console.log('[AniVault NF] Detected season from title:', seasonNumber)
      }

      // If we have a season number, assume overallEpisode is actually the season episode
      if (seasonNumber !== null && overallEpisode !== null) {
        seasonEpisode = overallEpisode
        console.log('[AniVault NF] Setting seasonEpisode =', seasonEpisode, 'for Season', seasonNumber)
      }

      console.log('[AniVault NF] ✅ Returning detection:', {
        platform: 'netflix',
        title: rawTitle,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url
      })

      return {
        platform: 'netflix',
        title: rawTitle,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url,
      }
    } catch (error) {
      console.error('[AniVault NF] ❌ Detection error:', error)
      return null
    }
  },
  findVideoElement,
}

/**
 * Zoro / HiAnime / AniWatch / ZoroX / AniWave adapter
 */
export const zoroAdapter: SiteAdapter = {
  id: 'zoro',
  match: (url) => /zoro|aniwatch|hianime|zorox|aniwave|gogoanime/i.test(url),
  detectEpisode: () => {
    try {
      const url = window.location.href
      let rawTitle = document.title || ''
      rawTitle = rawTitle.split('|')[0].split('-')[0].trim()

      const epCandidates: string[] = []
      document
        .querySelectorAll('h1, h2, .ep-title, .active-ep, .current-episode, [class*="episode"]')
        .forEach((el) => {
          const text = el.textContent || ''
          if (/episode/i.test(text) || /ep\s*\d+/i.test(text)) {
            epCandidates.push(text)
          }
        })

      const context = [rawTitle, ...epCandidates, document.title].filter(Boolean).join(' • ')

      let overallEpisode: number | null = null
      let seasonNumber: number | null = null
      let seasonEpisode: number | null = null

      const epMatch =
        context.match(/Episode\s+(\d{1,4})/i) ||
        context.match(/\bEp\.?\s*(\d{1,4})/i) ||
        context.match(/\bE(\d{1,4})\b/i)

      if (epMatch && epMatch[1]) {
        const e = parseInt(epMatch[1], 10)
        if (!isNaN(e)) overallEpisode = e
      }

      const seasonMatch = context.match(/Season\s+(\d{1,2})/i) || context.match(/\bS(\d{1,2})\b/i)
      if (seasonMatch && seasonMatch[1]) {
        const s = parseInt(seasonMatch[1], 10)
        if (!isNaN(s)) seasonNumber = s
      }

      const seMatch = context.match(/S(\d{1,2})\s*E(\d{1,3})/i)
      if (seMatch) {
        seasonNumber = parseInt(seMatch[1], 10)
        seasonEpisode = parseInt(seMatch[2], 10)
        overallEpisode = null
      }

      if (!rawTitle) return null

      return {
        platform: 'zoro',
        title: rawTitle,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url,
      }
    } catch (error) {
      console.error('[AniVault] Zoro detection error:', error)
      return null
    }
  },
  findVideoElement,
}

/**
 * 9anime and reskins adapter
 */
export const nineAnimeAdapter: SiteAdapter = {
  id: 'nineanime',
  match: (url) => /9anime|aniwave/i.test(url),
  detectEpisode: () => {
    try {
      const url = window.location.href
      let rawTitle = document.title || ''
      rawTitle = rawTitle.split('|')[0].split('-')[0].trim()

      const titleCandidates: string[] = []
      document.querySelectorAll('.ep-title, .title, h1, h2').forEach((el) => {
        const text = el.textContent?.trim()
        if (text) titleCandidates.push(text)
      })

      const context = [rawTitle, ...titleCandidates, document.title].filter(Boolean).join(' • ')

      let overallEpisode: number | null = null
      let seasonNumber: number | null = null
      let seasonEpisode: number | null = null

      const epMatch =
        context.match(/Episode\s+(\d{1,4})/i) ||
        context.match(/\bEp\.?\s*(\d{1,4})/i) ||
        context.match(/\bE(\d{1,4})\b/i)

      if (epMatch && epMatch[1]) {
        const e = parseInt(epMatch[1], 10)
        if (!isNaN(e)) overallEpisode = e
      }

      const seasonMatch = context.match(/Season\s+(\d{1,2})/i) || context.match(/\bS(\d{1,2})\b/i)
      if (seasonMatch && seasonMatch[1]) {
        const s = parseInt(seasonMatch[1], 10)
        if (!isNaN(s)) seasonNumber = s
      }

      if (!rawTitle) return null

      return {
        platform: 'nineanime',
        title: rawTitle,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url,
      }
    } catch (error) {
      console.error('[AniVault] 9anime detection error:', error)
      return null
    }
  },
  findVideoElement,
}

/**
 * AnimePahe adapter
 */
export const animepaheAdapter: SiteAdapter = {
  id: 'animepahe',
  match: (url) => /animepahe\.(com|ru)/i.test(url),
  detectEpisode: () => {
    try {
      const url = window.location.href

      const ogTitle =
        document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || ''

      const titleCandidates: string[] = []
      document.querySelectorAll('h1, h2, .title, .anime-title').forEach((el) => {
        const text = el.textContent?.trim()
        if (text) titleCandidates.push(text)
      })

      let rawTitle = ogTitle || titleCandidates[0] || document.title || ''
      rawTitle = rawTitle.split('|')[0].split('-').slice(0, 2).join('-').trim()

      const context = [document.title, ogTitle, ...titleCandidates].filter(Boolean).join(' • ')

      let overallEpisode: number | null = null
      let seasonNumber: number | null = null
      let seasonEpisode: number | null = null

      const epMatch =
        context.match(/Episode\s+(\d{1,4})/i) ||
        context.match(/\bEp\.?\s*(\d{1,4})/i) ||
        context.match(/\bE(\d{1,4})\b/i)

      if (epMatch && epMatch[1]) {
        const e = parseInt(epMatch[1], 10)
        if (!isNaN(e)) overallEpisode = e
      }

      const seasonMatch = context.match(/Season\s+(\d{1,2})/i) || context.match(/\bS(\d{1,2})\b/i)
      if (seasonMatch && seasonMatch[1]) {
        const s = parseInt(seasonMatch[1], 10)
        if (!isNaN(s)) seasonNumber = s
      }

      if (!rawTitle) return null

      return {
        platform: 'animepahe',
        title: rawTitle,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url,
      }
    } catch (error) {
      console.error('[AniVault] AnimePahe detection error:', error)
      return null
    }
  },
  findVideoElement,
}

/**
 * Generic fallback adapter for unknown anime sites
 */
export const genericAnimeAdapter: SiteAdapter = {
  id: 'generic',
  match: () => true,
  detectEpisode: () => {
    try {
      const url = window.location.href
      let rawTitle = document.title || ''
      rawTitle = rawTitle.split('|')[0].split('-')[0].trim()

      const heading =
        document.querySelector('h1')?.textContent?.trim() ||
        document.querySelector('.title')?.textContent?.trim() ||
        ''

      const context = [document.title, heading, rawTitle].filter(Boolean).join(' • ')

      let overallEpisode: number | null = null
      let seasonNumber: number | null = null
      let seasonEpisode: number | null = null

      const epMatch =
        context.match(/Episode\s+(\d{1,4})/i) ||
        context.match(/\bEp\.?\s*(\d{1,4})/i) ||
        context.match(/\bE(\d{1,4})\b/i)

      if (epMatch && epMatch[1]) {
        const e = parseInt(epMatch[1], 10)
        if (!isNaN(e)) overallEpisode = e
      }

      const seasonMatch = context.match(/Season\s+(\d{1,2})/i) || context.match(/\bS(\d{1,2})\b/i)
      if (seasonMatch && seasonMatch[1]) {
        const s = parseInt(seasonMatch[1], 10)
        if (!isNaN(s)) seasonNumber = s
      }

      if (!rawTitle && !heading) return null

      const title = rawTitle || heading

      return {
        platform: 'generic',
        title,
        overallEpisode,
        seasonNumber,
        seasonEpisode,
        url,
      }
    } catch (error) {
      console.error('[AniVault] Generic detection error:', error)
      return null
    }
  },
  findVideoElement,
}

/**
 * Array of all adapters in priority order
 */
export const adapters: SiteAdapter[] = [
  crunchyrollAdapter,
  netflixAdapter,
  zoroAdapter,
  nineAnimeAdapter,
  animepaheAdapter,
  genericAnimeAdapter,
]

/**
 * Get the active adapter for a given URL
 */
export function getActiveAdapter(url: string): SiteAdapter {
  const found = adapters.find((adapter) => adapter.match(url))
  return found ?? genericAnimeAdapter
}
