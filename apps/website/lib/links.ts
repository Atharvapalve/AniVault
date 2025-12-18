const defaultDownload =
  'https://github.com/anivault/AniVault/releases/latest/download/AniVault%20Setup%200.1.0.exe'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anivault.app'
// Contact email updated to anivault.one@gmail.com
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'anivault.one@gmail.com'

export const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL || defaultDownload
export const EXTENSION_URL =
  process.env.NEXT_PUBLIC_EXTENSION_URL ||
  'https://chromewebstore.google.com/detail/anivault-extension-placeholder'

export const CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL_PROD || 'https://anivault.lemonsqueezy.com/buy/485b9b33-04f9-462f-91b9-761dc4fc7601'

export const ANALYTICS_ID = process.env.NEXT_PUBLIC_ANALYTICS_ID || ''

export const SITE_TITLE = 'AniVault — Automatic Anime Tracker'
export const SITE_DESCRIPTION =
  'AniVault auto-tracks anime from VLC/MPV and streaming sites, syncs to AniList, and ships with a Chrome extension plus Discord Rich Presence.'





