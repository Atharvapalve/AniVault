const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1/licenses/activate'

/**
 * Validates a license key with LemonSqueezy
 */
export async function validateLicenseKey(key: string): Promise<boolean> {
  try {
    const response = await fetch(LEMONSQUEEZY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: key,
      }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()

    // Check if the license is valid and activated
    // Adjust this based on LemonSqueezy's actual response structure
    return data.valid === true && data.activated === true
  } catch (error) {
    console.error('Error validating license key:', error)
    return false
  }
}

declare global {
  interface Window {
    electron: {
      license: {
        getKey: () => Promise<string | null>
        storeKey: (key: string) => Promise<void>
      }
    }
  }
}

/**
 * Gets the stored license key
 */
export async function getStoredLicenseKey(): Promise<string | null> {
  return await window.electron.license.getKey()
}

/**
 * Stores a license key
 */
export async function storeLicenseKey(key: string): Promise<void> {
  await window.electron.license.storeKey(key)
}

