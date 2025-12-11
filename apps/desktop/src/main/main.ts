import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join, resolve } from 'path'
import { createServer, IncomingMessage, ServerResponse } from 'http'
// @ts-ignore - discord-rpc doesn't have type definitions
import pkg from 'discord-rpc'
const { Client, register } = pkg
import { createRequire } from 'module'
const { autoUpdater } = createRequire(import.meta.url)('electron-updater')
import log from 'electron-log'
import store from './store'
import { startPolling, stopWatcher } from './watcher'
import { buildOrganizePlan, applyOrganizePlan, type OrganizePlanItem } from './organizer'
import type { Anime, ExtensionEpisodeEvent } from '@anivault/shared'

// Extension HTTP server configuration
const EXTENSION_SERVER_PORT = 35847
const EXTENSION_ENDPOINT = '/extension-event'
let extensionServer: ReturnType<typeof createServer> | null = null

type DiscordPresenceMode = 'minimal' | 'stats' | 'weeb'

interface DiscordPresenceConfig {
  enabled: boolean
  mode: DiscordPresenceMode
  useMood: boolean
  showButtons: boolean
}

interface DiscordPresenceContext {
  title: string
  episode: number
  totalEpisodes?: number
  episodesThisSession?: number
  episodesToday?: number
  moodLabel?: string
  moodEmoji?: string
  themeId?: string
}

let mainWindow: BrowserWindow | null = null

// Auto-update events
autoUpdater.on('update-available', (info) => {
  log.info('Update available', info)
  mainWindow?.webContents.send('update:available', info)
})

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded', info)
  mainWindow?.webContents.send('update:downloaded', info)
})

// Logging for auto-updates
autoUpdater.logger = log
// @ts-ignore - electron-log transport typing
autoUpdater.logger.transports.file.level = 'info'

// Discord RPC client
const DISCORD_CLIENT_ID = import.meta.env.DISCORD_CLIENT_ID || '1447800723512361040'
let discordClient: any = null
let presenceConfig: DiscordPresenceConfig = {
  enabled: true,
  mode: 'minimal',
  useMood: true,
  showButtons: true,
}
let presenceClearTimeout: NodeJS.Timeout | null = null
const PRESENCE_CLEAR_DELAY = 30000 // Clear presence after 30 seconds of no activity
const PRESENCE_CLEAR_SHORT_DELAY = 10000 // Clear presence after 10 seconds when explicitly cleared

function buildDiscordActivity(ctx: DiscordPresenceContext, isPro: boolean): any | null {
  if (!ctx.title) return null

  const {
    title,
    episode,
    totalEpisodes,
    episodesThisSession,
    episodesToday,
    moodLabel,
    moodEmoji,
    themeId,
  } = ctx

  let largeImageKey = 'anivault-logo'
  if (isPro && themeId) {
    if (themeId.includes('neon')) largeImageKey = 'anivault-neon'
    else if (themeId.includes('midnight')) largeImageKey = 'anivault-midnight'
  }

  let details = `Watching ${title}`
  let state = `Episode ${episode}${totalEpisodes ? ` / ${totalEpisodes}` : ''}`
  const buttons: Array<{ label: string; url: string }> = []

  if (!isPro) {
    return {
      details,
      state,
      largeImageKey,
      instance: false,
    }
  }

  const mode = presenceConfig.mode

  if (mode === 'minimal') {
    details = `Watching ${title}`
    state = `Ep ${episode}${totalEpisodes ? ` / ${totalEpisodes}` : ''}`
  } else if (mode === 'stats') {
    const parts: string[] = []
    parts.push(`Ep ${episode}${totalEpisodes ? `/${totalEpisodes}` : ''}`)
    if (typeof episodesThisSession === 'number' && episodesThisSession > 0) {
      parts.push(`${episodesThisSession} eps this session`)
    }
    if (typeof episodesToday === 'number' && episodesToday > 0) {
      parts.push(`${episodesToday} today`)
    }
    details = `Bingeing ${title}`
    state = parts.join(' • ')
  } else if (mode === 'weeb') {
    const moodText =
      presenceConfig.useMood && moodLabel
        ? `${moodEmoji ?? ''} ${moodLabel}`.trim()
        : 'Anime session'

    const parts: string[] = []
    parts.push(`Ep ${episode}${totalEpisodes ? `/${totalEpisodes}` : ''}`)
    if (typeof episodesThisSession === 'number' && episodesThisSession > 0) {
      parts.push(`${episodesThisSession} eps this session`)
    }

    details = moodText
    state = `${title} — ${parts.join(' • ')}`
  }

  if (presenceConfig.showButtons) {
    buttons.push({
      label: 'View on AniList',
      url: 'https://anilist.co/',
    })
    buttons.push({
      label: 'Get AniVault',
      url: 'https://your-anivault-website-url.com',
    })
  }

  const activity: any = {
    details,
    state,
    largeImageKey,
    instance: false,
  }

  if (buttons.length > 0) {
    activity.buttons = buttons
  }

  return activity
}

/**
 * Initialize Discord RPC client
 */
async function initDiscordRPC() {
  try {
    // Register the Discord client ID
    register(DISCORD_CLIENT_ID)
    
    discordClient = new Client({ transport: 'ipc' })
    
    await discordClient.connect(DISCORD_CLIENT_ID)
    console.log('Discord RPC connected')
    
    // Set initial presence
    await discordClient.setActivity({
      details: 'AniVault',
      state: 'Ready to track anime',
      largeImageKey: 'logo',        // <--- This must match the Asset Name in Discord Portal
      largeImageText: 'AniVault',   // Tooltip when hovering over the image
    })
  } catch (error) {
    console.error('Failed to initialize Discord RPC:', error)
    discordClient = null
  }
}

/**
 * Update Discord presence with current anime episode
 */
async function updateDiscordPresence(title: string, episode: number) {
  if (!discordClient) {
    return
  }

  // Clear any existing timeout
  if (presenceClearTimeout) {
    clearTimeout(presenceClearTimeout)
    presenceClearTimeout = null
  }

  try {
    const activity = buildDiscordActivity(
      {
        title,
        episode,
      },
      false
    )
    if (!activity) return
    await discordClient.setActivity(activity)

    // Set timeout to revert to default presence after inactivity
    presenceClearTimeout = setTimeout(() => {
      setDefaultDiscordPresence()
      presenceClearTimeout = null
    }, PRESENCE_CLEAR_DELAY)
  } catch (error) {
    console.error('Failed to update Discord presence:', error)
  }
}

/**
 * Schedule Discord presence to revert to default after inactivity
 * This is called when tracking stops or no activity is detected
 */
function schedulePresenceClear() {
  // Clear any existing timeout
  if (presenceClearTimeout) {
    clearTimeout(presenceClearTimeout)
    presenceClearTimeout = null
  }

  // Immediately revert to default presence when explicitly cleared
  setDefaultDiscordPresence()
}

/**
 * Set Discord presence to default "AniVault ready to track anime"
 */
async function setDefaultDiscordPresence() {
  if (!discordClient) {
    return
  }

  // Clear any pending timeout
  if (presenceClearTimeout) {
    clearTimeout(presenceClearTimeout)
    presenceClearTimeout = null
  }

  try {
    await discordClient.setActivity({
      details: 'AniVault',
      state: 'Ready to track anime',
      largeImageKey: 'logo',
      largeImageText: 'AniVault',
    })
  } catch (error) {
    console.error('Failed to set default Discord presence:', error)
  }
}

/**
 * Clear Discord presence (legacy - now sets to default instead)
 */
async function clearDiscordPresence() {
  await setDefaultDiscordPresence()
}

// --- WINDOW CONTROL HANDLERS (Registered once, outside createWindow) ---
// These handlers need to be registered before the window is created
// so they're available immediately when the renderer process loads
let handlersRegistered = false

function registerWindowHandlers() {
  if (handlersRegistered) return

  ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show() // ensure visible so Windows animation plays
      mainWindow.minimize()
    }
  })

  ipcMain.handle('window-maximize', () => {
    if (!mainWindow) return

    const wasMaximized = mainWindow.isMaximized()

    if (wasMaximized) {
      mainWindow.unmaximize()
      mainWindow.webContents.send('window-unmaximized', false)
    } else {
      mainWindow.maximize()
      mainWindow.webContents.send('window-maximized', true)
    }
  })

  ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close()
  })

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  handlersRegistered = true
}

/**
 * Handle extension episode completion events
 */
function handleExtensionEpisodeComplete(event: {
  platform: 'crunchyroll' | 'netflix' | 'zoro' | 'nineanime' | 'animepahe' | 'generic'
  title: string
  overallEpisode: number | null
  seasonNumber: number | null
  seasonEpisode: number | null
  url: string
  watchedSeconds: number
  durationSeconds: number
  progress: number
  completedAt: string
}) {
  console.log('[AniVault] Desktop received extension completion:', {
    title: event.title,
    platform: event.platform,
    overallEpisode: event.overallEpisode,
    seasonNumber: event.seasonNumber,
    seasonEpisode: event.seasonEpisode,
    progress: event.progress,
    watchedSeconds: event.watchedSeconds,
    durationSeconds: event.durationSeconds,
  })
  // Convert to the format expected by the renderer
  // Use overallEpisode if available, otherwise seasonEpisode
  const episode = event.overallEpisode ?? event.seasonEpisode ?? null

  if (episode === null) {
    console.warn('[AniVault] Extension event missing episode number:', event)
    return
  }

  // Forward to renderer process via IPC with season info
  const browserWindows = BrowserWindow.getAllWindows()
  browserWindows.forEach((win) => {
    win.webContents.send('tracking:detected', {
      title: event.title,
      episode: episode,
      overallEpisode: event.overallEpisode,
      seasonNumber: event.seasonNumber,
      seasonEpisode: event.seasonEpisode,
      source: 'extension',
      platform: event.platform,
    })
  })

  // Also update Discord presence if applicable
  updateDiscordPresence(event.title, episode)
}

/**
 * Start HTTP server for extension communication
 */
function startExtensionServer() {
  if (extensionServer) {
    return // Already started
  }

  extensionServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    // Handle OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    // Handle clear detection endpoint (both POST and GET for compatibility)
    if ((req.method === 'POST' || req.method === 'GET') && req.url === `${EXTENSION_ENDPOINT}/clear`) {
      // Extension is clearing detection - schedule Discord presence clear
      schedulePresenceClear()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
      return
    }

    // Only handle POST to the extension endpoint
    if (req.method === 'POST' && req.url === EXTENSION_ENDPOINT) {
      let body = ''

      req.on('data', (chunk) => {
        body += chunk.toString()
      })

      req.on('end', () => {
        try {
          const event = JSON.parse(body) as ExtensionEpisodeEvent

          // Validate required fields
          if (event.title && event.platform) {
            console.log(
              `[AniVault] Extension event from ${event.platform}: ${event.title} (overall ${event.overallEpisode ?? '?'} / S${event.seasonNumber ?? '?'} E${event.seasonEpisode ?? '?'})`
            )

            // Forward full payload to renderer(s)
            const browserWindows = BrowserWindow.getAllWindows()
            browserWindows.forEach((win) => {
              const episodeForLegacy = event.overallEpisode ?? event.seasonEpisode ?? null
              win.webContents.send('tracking:detected', {
                platform: event.platform,
                title: event.title,
                // Legacy episode field for existing renderer handlers
                episode: episodeForLegacy,
                overallEpisode: event.overallEpisode ?? null,
                seasonNumber: event.seasonNumber ?? null,
                seasonEpisode: event.seasonEpisode ?? null,
                url: event.url ?? null,
                watchedSeconds: event.watchedSeconds ?? null,
                durationSeconds: event.durationSeconds ?? null,
                progress: event.progress ?? null,
                completedAt: event.completedAt ?? new Date().toISOString(),
                source: 'extension',
              })
            })

            // Update Discord presence using the best available episode number
            const presenceEpisode = event.overallEpisode ?? event.seasonEpisode ?? null
            if (presenceEpisode !== null) {
              updateDiscordPresence(event.title, presenceEpisode)
            }

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: false, error: 'Invalid event data' }))
          }
        } catch (error) {
          console.error('[AniVault] Error parsing extension event:', error)
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }))
        }
      })
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  extensionServer.listen(EXTENSION_SERVER_PORT, '127.0.0.1', () => {
    console.log(`[AniVault] Extension server listening on http://127.0.0.1:${EXTENSION_SERVER_PORT}`)
  })

  extensionServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`[AniVault] Extension server port ${EXTENSION_SERVER_PORT} is already in use`)
    } else {
      console.error('[AniVault] Extension server error:', error)
    }
  })
}

/**
 * Stop extension HTTP server
 */
function stopExtensionServer() {
  if (extensionServer) {
    extensionServer.close()
    extensionServer = null
    console.log('[AniVault] Extension server stopped')
  }
}

// AniList OAuth configuration
const ANILIST_CLIENT_ID = import.meta.env.VITE_ANILIST_CLIENT_ID || '32987'
const ANILIST_CLIENT_SECRET = import.meta.env.ANILIST_CLIENT_SECRET || 'YOUR_FALLBACK_SECRET'
const ANILIST_REDIRECT_URI = import.meta.env.VITE_ANILIST_REDIRECT_URI || 'anivault://auth/callback'

/**
 * Exchanges an authorization code for an access token
 */
async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch('https://anilist.co/api/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: ANILIST_CLIENT_ID,
      client_secret: ANILIST_CLIENT_SECRET,
      redirect_uri: ANILIST_REDIRECT_URI,
      code,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('AniList token error:', response.status, text)
    throw new Error('Failed to exchange code for token')
  }

  const data = await response.json() as { access_token: string }

  if (!data.access_token) {
    throw new Error('No access_token in token response')
  }

  return data.access_token
}

function handleOAuthCallback(url: string) {
  // Extract access token from URL fragment
  try {
    console.log('Processing OAuth URL:', url) // Debug Log 1

    const urlObj = new URL(url)
    const hash = urlObj.hash.substring(1) // Remove #
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')

    console.log('Extracted Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null') // Debug Log 2 (truncated for security)

    if (accessToken) {
      // Store the token
      store.set('accessToken', accessToken)
      // Send token to renderer via IPC
      const windows = BrowserWindow.getAllWindows()
      windows.forEach(win => {
        win.webContents.send('auth:token-received', accessToken)
      })
      console.log('Token stored and sent to renderer')
    } else {
      console.warn('No access token found in OAuth callback URL')
    }
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    transparent: true,
    backgroundColor: '#05050500',
    titleBarStyle: 'hidden',
    // Ensure window animations work properly
    skipTaskbar: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // <--- Critical: Allows preload script to use import statements
    },
  })

  mainWindow = window

  // Listen for window state changes and notify renderer
  window.on('maximize', () => {
    window.webContents.send('window-maximized', true)
  })

  window.on('unmaximize', () => {
    window.webContents.send('window-unmaximized', false)
  })

  if (process.env.NODE_ENV === 'development') {
    window.loadURL('http://localhost:5173')
    window.webContents.openDevTools()
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Auth handlers
  ipcMain.handle('auth:open-oauth-window', async (_, authUrl: string) => {
    return new Promise<string | null>((resolve, reject) => {
      const authWindow = new BrowserWindow({
        width: 500,
        height: 700,
        show: true,
        modal: true,
        parent: mainWindow ?? undefined,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      })

      let resolved = false

      const handleUrl = async (url: string) => {
        if (!url.startsWith('anivault://')) return

        try {
          const urlObj = new URL(url)
          const code = urlObj.searchParams.get('code') // <-- auth code

          if (!code) {
            throw new Error('No code in callback URL')
          }

          const accessToken = await exchangeCodeForToken(code)

          store.set('accessToken', accessToken)
          resolved = true
          resolve(accessToken)
          authWindow.close()
        } catch (err) {
          console.error('OAuth callback error:', err)
          if (!resolved) {
            resolved = true
            reject(err)
            authWindow.close()
          }
        }
      }

      authWindow.webContents.on('did-navigate', (_event, url) => {
        void handleUrl(url)
      })

      authWindow.webContents.on('will-redirect', (event, url) => {
        // intercept custom protocol redirects
        if (url.startsWith('anivault://')) {
          event.preventDefault()
          void handleUrl(url)
        }
      })

      authWindow.on('closed', () => {
        if (!resolved) {
          resolved = true
          resolve(null) // user closed window
        }
      })

      authWindow.loadURL(authUrl)
      // Optional: debug what AniList is actually returning
      // authWindow.webContents.openDevTools({ mode: 'detach' })
    })
  })

  ipcMain.handle('auth:get-token', () => {
    return store.get('accessToken')
  })

  ipcMain.handle('auth:logout', () => {
    store.delete('accessToken')
    store.delete('user')
  })

  // Open external browser for OAuth
  ipcMain.handle('auth:open-external', async (_, url: string) => {
    await shell.openExternal(url)
  })

  // License handlers
  ipcMain.handle('license:get-key', () => {
    return store.get('licenseKey')
  })

  ipcMain.handle('license:store-key', (_, key: string) => {
    store.set('licenseKey', key)
  })

  ipcMain.handle('license:validate', async (_, key: string) => {
    try {
      console.log('Validating license key:', key)

      const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          license_key: key,
          instance_name: 'AniVault Desktop',
        }),
      })

      const data = await response.json()

      // Check if activated
      if (data.activated && data.license_key?.status === 'active') {
        store.set('licenseKey', key)
        return { success: true }
      }

      return { success: false, error: data.error || 'Invalid key' }
    } catch (error) {
      console.error('License validation failed:', error)
      return { success: false, error: 'Network error' }
    }
  })

  ipcMain.handle('app:check-for-updates', async () => {
    try {
      const res = await autoUpdater.checkForUpdates()
      return res
    } catch (error: any) {
      log.warn('app:check-for-updates failed', error)
      return { error: true, message: error?.message ?? 'Unknown error' }
    }
  })

  ipcMain.handle('dialog:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  // Organizer IPC
  ipcMain.handle('organizer:scan', async (_event, args: { sourceDir: string; targetRoot: string; library: Anime[] }) => {
    const { sourceDir, targetRoot, library } = args
    if (!sourceDir || !targetRoot) {
      throw new Error('sourceDir and targetRoot are required')
    }
    return buildOrganizePlan(sourceDir, targetRoot, library || [])
  })

  ipcMain.handle('organizer:apply', async (_event, args: { plan: OrganizePlanItem[]; logPath: string }) => {
    await applyOrganizePlan(args.plan || [], args.logPath)
  })

  // Presence configuration update (Pro settings)
  ipcMain.handle('presence:update-config', (_event, config: Partial<DiscordPresenceConfig>) => {
    presenceConfig = { ...presenceConfig, ...config }
  })

  // Presence context update
  ipcMain.handle('presence:update-now', async (_event, ctx: DiscordPresenceContext & { isPro: boolean }) => {
    if (!presenceConfig.enabled) return
    if (!discordClient) return

    // Clear any existing timeout
    if (presenceClearTimeout) {
      clearTimeout(presenceClearTimeout)
      presenceClearTimeout = null
    }

    try {
      const activity = buildDiscordActivity(ctx, ctx.isPro)
      if (!activity) return
      await discordClient.setActivity(activity)

      // Set timeout to clear presence after inactivity
      presenceClearTimeout = setTimeout(() => {
        clearDiscordPresence()
        presenceClearTimeout = null
      }, PRESENCE_CLEAR_DELAY)
    } catch (err) {
      console.error('Failed to update Discord presence:', err)
    }
  })

  // AniList GraphQL proxy (avoids renderer CORS issues)
  ipcMain.handle('anilist:graphql', async (_event, payload: { query: string; variables?: Record<string, unknown>; accessToken?: string | null }) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    if (payload?.accessToken) {
      headers['Authorization'] = `Bearer ${payload.accessToken}`
    }

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: payload?.query,
        variables: payload?.variables,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`AniList API error (${response.status}): ${errorBody}`)
    }

    const data = await response.json()
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    return data
  })
}

// 1. Request the "Single Instance Lock" immediately
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // If we didn't get the lock, it means another instance is running.
  // Quit this new instance immediately.
  app.quit()
} else {
  // We got the lock! We are the primary instance.

  // 2. Listen for the second instance trying to open (This handles the Protocol URL)
  app.on('second-instance', (_, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    // Windows passes the URL as a command line argument
    const url = commandLine.find(arg => arg.startsWith('anivault://'))
    if (url) {
      console.log('Deep link received via second-instance:', url) // Debug log
      handleOAuthCallback(url)
    }
  })

  // 3. Initialize the app normally
  app.whenReady().then(async () => {
    // Register window control handlers BEFORE creating window
    registerWindowHandlers()
    
    // Register custom protocol
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('anivault', process.execPath, [resolve(process.argv[1])])
      }
    } else {
      app.setAsDefaultProtocolClient('anivault')
    }

    createWindow()

    // Kick off auto-update check shortly after launch
    setTimeout(() => {
      try {
        autoUpdater.checkForUpdatesAndNotify()
      } catch (err) {
        log.warn('autoUpdater check failed', err)
      }
    }, 5000)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })

    // Initialize Discord RPC (sets default "AniVault ready to track anime" presence)
    await initDiscordRPC()

    // Start media watcher
    startPolling(async (data) => {
      // Update Discord presence when episode is detected
      await updateDiscordPresence(data.title, data.episode)
    })

    // Start extension HTTP server
    startExtensionServer()

    // Handle macOS/Linux protocol URL (Open URL event)
    app.on('open-url', (event, url) => {
      event.preventDefault()
      console.log('Deep link received via open-url:', url) // Debug log
      handleOAuthCallback(url)
    })
  })
}



    app.on('window-all-closed', async () => {
      if (process.platform !== 'darwin') {
        stopWatcher()
        stopExtensionServer()
        await clearDiscordPresence()
        if (discordClient) {
          try {
            await discordClient.destroy()
          } catch (error) {
            console.error('Error destroying Discord client:', error)
          }
          discordClient = null
        }
        app.quit()
      }
    })

    app.on('before-quit', async () => {
      stopWatcher()
      stopExtensionServer()
      await clearDiscordPresence()
      if (discordClient) {
        try {
          await discordClient.destroy()
        } catch (error) {
          console.error('Error destroying Discord client:', error)
        }
        discordClient = null
      }
    })

