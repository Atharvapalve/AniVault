// Replace with your actual Client ID from AniList
const ANILIST_CLIENT_ID = import.meta.env.VITE_ANILIST_CLIENT_ID || '32987'
const ANILIST_REDIRECT_URI = 'anivault://auth/callback'


const ANILIST_AUTH_URL =
  `https://anilist.co/api/v2/oauth/authorize` +
  `?client_id=${ANILIST_CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(ANILIST_REDIRECT_URI)}` +
  `&response_type=code`

/**
 * Initiates AniList OAuth login flow
 */
export async function loginWithAnilist(): Promise<string> {
  if (!window.electron?.auth?.openOAuthWindow) {
    throw new Error('Authentication system not initialized. Please restart the app.')
  }

  console.log('Opening Auth URL:', ANILIST_AUTH_URL)
  const token = await window.electron.auth.openOAuthWindow(ANILIST_AUTH_URL)

  if (token) return token
  throw new Error('Authentication cancelled or failed')
}

/**
 * Logs out the current user
 */
export async function logout(): Promise<void> {
  await window.electron.auth.logout()
}

/**
 * Gets the stored access token
 */
export async function getStoredToken(): Promise<string | null> {
  return await window.electron.auth.getToken()
}
