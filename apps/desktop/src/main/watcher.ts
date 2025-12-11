import { BrowserWindow } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Smart anime filename parser
 * Extracts title and episode number from various filename formats
 */
export function parseAnimeFilename(filename: string): { title: string | null; episode: number | null } {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^.]*$/, '')
  
  // Try to extract episode number using various patterns
  const episodePatterns = [
    /[Ss](\d+)[Ee](\d+)/,                    // S01E01, S1E1
    /[Ee]p(?:isode)?\s*(\d+)/i,              // Ep1, Episode 1, ep 1
    /[Ee](\d+)(?:\s|$|\[|\(|v)/,              // E1, E01
    /\s-\s*(\d+)(?:\s|$|\[|\(|v)/,            // - 1, - 01
    /\[(\d+)\](?:\s|$)/,                      // [1], [01]
    /\((\d+)\)(?:\s|$)/,                      // (1), (01)
    /\s(\d+)(?:\s|$|\[|\(|v)/,                // Space followed by number
  ]

  let episode: number | null = null
  let title = nameWithoutExt

  // Try each pattern
  for (const pattern of episodePatterns) {
    const match = nameWithoutExt.match(pattern)
    if (match) {
      // For S01E01 format, use episode number (second group)
      if (pattern.source.includes('[Ss]') && match[2]) {
        episode = parseInt(match[2], 10)
        // Remove the season/episode part from title
        title = nameWithoutExt.replace(pattern, '').trim()
      } else if (match[1]) {
        episode = parseInt(match[1], 10)
        // Remove the episode part from title
        title = nameWithoutExt.replace(pattern, '').trim()
      }
      
      if (episode && !isNaN(episode)) {
        break
      }
    }
  }

  // Clean up title - remove common prefixes/suffixes
  title = title
    .replace(/^\[.*?\]\s*/, '')              // Remove [Release Group]
    .replace(/\s*\[.*?\]\s*$/, '')           // Remove trailing [tags]
    .replace(/\s*\(.*?\)\s*$/, '')           // Remove trailing (tags)
    .replace(/\s*-\s*$/, '')                 // Remove trailing dash
    .replace(/\s+/g, ' ')                     // Normalize whitespace
    .trim()

  // If we found an episode but title is empty or too short, use original filename
  if (episode && (!title || title.length < 2)) {
    title = nameWithoutExt.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim()
  }

  return {
    title: title || null,
    episode: episode && !isNaN(episode) ? episode : null,
  }
}

// Add any new .exe names to this list (lowercase)
const MEDIA_PLAYERS = [
  'vlc.exe',          // VLC Media Player
  'mpv.exe',          // MPV
  'mpc-hc.exe',       // Media Player Classic - Home Cinema
  'mpc-be.exe',       // Media Player Classic - Black Edition
  'potplayer.exe',    // PotPlayer
  'kodi.exe',         // Kodi
  'wmplayer.exe',     // Windows Media Player (Legacy)
  'kmplayer.exe',     // KMPlayer (New addition)
  'gom.exe',          // GOM Player (New addition)
  'plex.exe',         // Plex Media Player (New addition)
  'ffplay.exe'        // FFmpeg Play (New addition)
]

let watcherInterval: NodeJS.Timeout | null = null
let lastDetectedEpisode: { title: string; episode: number } | null = null

/**
 * Gets active window titles on Windows using tasklist
 */
async function getActiveWindows(): Promise<Array<{ title: string; process: string }>> {
  try {
    const { stdout, stderr } = await execAsync('tasklist /v /fo csv')

    if (!stdout || stdout.trim().length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Watcher] tasklist returned no stdout', { stderr })
      }
      return []
    }
    
    const windows: Array<{ title: string; process: string }> = []
    const lines = stdout.split('\n')
    
    // Skip header line (first line)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Parse CSV line (simplified - real CSV parsing would be better)
      const parts = line.match(/"(.*?)"/g)
      if (parts && parts.length >= 9) {
        const processName = parts[0].replace(/"/g, '').toLowerCase()
        const windowTitle = parts[8].replace(/"/g, '').trim()
        
        // Skip if no window title or it's "N/A"
        if (!windowTitle || windowTitle === 'N/A' || windowTitle.length === 0) {
          continue
        }
        
        // Check if it's a media player
        const isMediaPlayer = MEDIA_PLAYERS.some((player) => processName.includes(player))
        
        if (isMediaPlayer && windowTitle) {
          windows.push({
            title: windowTitle,
            process: processName,
          })
        }
      }
    }
    
    return windows
  } catch (error: any) {
    // Handle cancellation/timeout gracefully - these are normal
    if (
      error?.code === 'ETIMEDOUT' || 
      error?.message?.includes('timeout') || 
      error?.message?.includes('cancelled') ||
      error?.message?.includes('Call cancelled') ||
      error?.code === 1
    ) {
      // Command was cancelled or timed out - this is normal, just return empty
      return []
    }
    
    // Only log unexpected errors in development
    if (process.env.NODE_ENV === 'development' && !error?.message?.includes('cancelled')) {
      console.error('Error getting active windows:', error?.message || error)
    }
    return []
  }
}

/**
 * Starts polling for active media player windows
 * Runs every 10 seconds
 */
export function startPolling(callback: (data: { title: string; episode: number }) => void) {
  if (watcherInterval) {
    return // Already running
  }

  console.log('Starting media watcher...')

  watcherInterval = setInterval(async () => {
    try {
      const windows = await getActiveWindows()
      if (process.env.NODE_ENV === 'development') {
        console.log('[Watcher] tasklist windows:', windows.slice(0, 5))
      }
      
      if (windows.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Watcher] No media windows detected')
        }
        return
      }

      // Check each window for episode numbers using smart parser
      for (const window of windows) {
        try {
          // Parse the window title
          const parsed = parseAnimeFilename(window.title)
          if (process.env.NODE_ENV === 'development') {
            console.log('[Watcher] Parsed window:', { windowTitle: window.title, parsed })
          }

          // Check if we found an episode
          if (!parsed.episode || !parsed.title) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[Watcher] Skipping - no episode/title', window.title)
            }
            continue
          }

          const title = parsed.title
          const episode = parsed.episode

          // Check if valid
          if (!title || isNaN(episode)) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[Watcher] Skipping - invalid data', { title, episode })
            }
            continue
          }

        // Avoid duplicate notifications
        if (
          lastDetectedEpisode &&
            lastDetectedEpisode.title === title &&
            lastDetectedEpisode.episode === episode
        ) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Watcher] Skipping duplicate', { title, episode })
          }
          continue
        }

          lastDetectedEpisode = { title, episode: episode }

        // Call the callback
        callback({
            title,
            episode,
        })

        // Send IPC message to renderer
        const browserWindows = BrowserWindow.getAllWindows()
        browserWindows.forEach((win) => {
          win.webContents.send('tracking:detected', {
              title,
              episode,
          })
        })

          console.log(`Detected: ${title} - Episode ${episode}`)
        break // Only process first match
        } catch (error) {
          // Silently fail for individual window parsing errors
          if (process.env.NODE_ENV === 'development') {
            console.error('Error parsing window title:', window.title, error)
          }
          continue
        }
      }
    } catch (error) {
      // Silently fail - don't spam console
      if (process.env.NODE_ENV === 'development') {
        console.error('Watcher error:', error)
      }
    }
  }, 10000) // Poll every 10 seconds
}

export function stopWatcher() {
  if (watcherInterval) {
    clearInterval(watcherInterval)
    watcherInterval = null
    console.log('Stopped media watcher')
  }
}

// Legacy exports for backward compatibility
export function startWatcher() {
  startPolling(() => {}) // Empty callback, IPC handles it
}
