const defaultDownload =
  'https://github.com/anivault/AniVault/releases/latest/download/AniVault%20Setup%200.1.0.exe'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anivault.app'
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@anivault.app'

export const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL || defaultDownload
export const EXTENSION_URL =
  process.env.NEXT_PUBLIC_EXTENSION_URL ||
  'https://chromewebstore.google.com/detail/anivault-extension-placeholder'

export const CHECKOUT_SANDBOX = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL_SANDBOX || ''
export const CHECKOUT_PROD = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL_PROD || ''
export const CHECKOUT_URL = CHECKOUT_PROD || CHECKOUT_SANDBOX

export const ANALYTICS_ID = process.env.NEXT_PUBLIC_ANALYTICS_ID || ''

export const SITE_TITLE = 'AniVault — Automatic Anime Tracker'
export const SITE_DESCRIPTION =
  'AniVault auto-tracks anime from VLC/MPV and streaming sites, syncs to AniList, and ships with a Chrome extension plus Discord Rich Presence.'





