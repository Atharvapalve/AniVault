/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANILIST_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electron: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
    onMaximize: (callback: (isMaximized: boolean) => void) => void
    onUnmaximize: (callback: (isMaximized: boolean) => void) => void
    // Auth IPC
    auth: {
      openExternal: (url: string) => Promise<void>
      onTokenReceived: (callback: (token: string) => void) => void
      removeTokenListener: () => void
      getToken: () => Promise<string | null>
      logout: () => Promise<void>
      // Legacy method (kept for backward compatibility)
      openOAuthWindow: (url: string) => Promise<string | null>
    }
    // License IPC
    license: {
      getKey: () => Promise<string | null>
      storeKey: (key: string) => Promise<void>
    }
    // Tracking IPC
    tracking: {
      onUpdate: (callback: (data: { title: string; episode: number }) => void) => void
      removeListener: () => void
    }
  }
}

