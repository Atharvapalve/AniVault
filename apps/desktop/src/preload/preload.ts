import { contextBridge, ipcRenderer } from 'electron'

type RendererPresenceMode = 'minimal' | 'stats' | 'weeb'

interface RendererPresenceContext {
  title: string
  episode: number
  totalEpisodes?: number
  episodesThisSession?: number
  episodesToday?: number
  moodLabel?: string
  moodEmoji?: string
  themeId?: string
  isPro: boolean
}

contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximize: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window-maximized', (_, isMaximized: boolean) => callback(isMaximized))
  },
  onUnmaximize: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window-unmaximized', (_, isMaximized: boolean) => callback(isMaximized))
  },
  // Auth IPC
  auth: {
    openExternal: (url: string) => ipcRenderer.invoke('auth:open-external', url),
    onTokenReceived: (callback: (token: string) => void) => {
      ipcRenderer.on('auth:token-received', (_, token) => callback(token))
    },
    removeTokenListener: () => {
      ipcRenderer.removeAllListeners('auth:token-received')
    },
    getToken: () => ipcRenderer.invoke('auth:get-token'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    // Legacy method (kept for backward compatibility)
    openOAuthWindow: (url: string) => ipcRenderer.invoke('auth:open-oauth-window', url),
  },
  // License IPC
  license: {
    getKey: () => ipcRenderer.invoke('license:get-key'),
    storeKey: (key: string) => ipcRenderer.invoke('license:store-key', key),
    validate: (key: string) => ipcRenderer.invoke('license:validate', key),
  },
  // AniList GraphQL proxy
  anilist: {
    graphql: (payload: { query: string; variables?: Record<string, unknown>; accessToken?: string | null }) =>
      ipcRenderer.invoke('anilist:graphql', payload),
  },
    // Tracking IPC
    tracking: {
      onUpdate: (callback: (data: { 
        title: string
        episode: number
        overallEpisode?: number
        seasonNumber?: number
        seasonEpisode?: number
        source?: string
        platform?: string
      }) => void) => {
        ipcRenderer.on('tracking:update', (_, data) => callback(data))
        ipcRenderer.on('tracking:detected', (_, data) => callback(data))
      },
      removeListener: () => {
        ipcRenderer.removeAllListeners('tracking:update')
        ipcRenderer.removeAllListeners('tracking:detected')
      },
    },
  // Presence IPC
  presence: {
    updateConfig: (config: Partial<{ enabled: boolean; mode: RendererPresenceMode; useMood: boolean; showButtons: boolean }>) =>
      ipcRenderer.invoke('presence:update-config', config),
    updateNow: (ctx: RendererPresenceContext) =>
      ipcRenderer.invoke('presence:update-now', ctx),
  },
  // Organizer IPC
  organizer: {
    scan: (sourceDir: string, targetRoot: string, library: any[]) =>
      ipcRenderer.invoke('organizer:scan', { sourceDir, targetRoot, library }),
    apply: (plan: any[], logPath: string) =>
      ipcRenderer.invoke('organizer:apply', { plan, logPath }),
  },
  // Dialog IPC
  dialog: {
    selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
    },
})

