import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, KeyRound, Crown, AlertTriangle } from 'lucide-react'
import Toast from './Toast'
import { useStore } from '../store/useStore'

const maskLicenseKey = (key: string | null) => {
  if (!key) return ''
  // Keep last 4 characters visible, mask the rest but preserve dashes
  return key.replace(/[A-Za-z0-9](?=[A-Za-z0-9]{4})/g, 'X')
}

const LicenseSettings = () => {
  const { isPro, licenseKey, activatePro, deactivatePro, devTogglePro } = useStore()
  const [inputKey, setInputKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success')

  const maskedKey = useMemo(() => maskLicenseKey(licenseKey), [licenseKey])

  const handleActivate = async () => {
    setIsLoading(true)
    setStatusMessage('')
    try {
      const success = await activatePro(inputKey)
      if (success) {
        setStatusMessage('License activated! Enjoy AniVault Pro.')
        setToastType('success')
        setToastMessage('Pro activated successfully')
        setToastVisible(true)
      } else {
        setStatusMessage('Invalid license key. Please check and try again.')
        setToastType('error')
        setToastMessage('Activation failed')
        setToastVisible(true)
      }
    } catch (error) {
      console.error('Failed to activate license:', error)
      setStatusMessage('Something went wrong. Please try again.')
      setToastType('error')
      setToastMessage('Activation error')
      setToastVisible(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async () => {
    setIsLoading(true)
    setStatusMessage('')
    try {
      await deactivatePro()
      setStatusMessage('License deactivated. You are now on the Free plan.')
      setToastType('info')
      setToastMessage('Pro deactivated')
      setToastVisible(true)
    } catch (error) {
      console.error('Failed to deactivate license:', error)
      setStatusMessage('Failed to deactivate license. Please try again.')
      setToastType('error')
      setToastMessage('Deactivation error')
      setToastVisible(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevToggle = () => {
    devTogglePro()
    setToastType('info')
    setToastMessage('Dev Mode: Pro Status Switched')
    setToastVisible(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="text-yellow-400" size={24} />
        <div>
          <p className="text-lg font-semibold">AniVault Pro</p>
          <p className="text-sm text-white/60">
            Unlock Pro features with your license key.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isPro ? (
          <motion.div
            key="pro-card"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-5 shadow-lg shadow-yellow-500/10"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-yellow-300" size={28} />
                <div>
                  <p className="text-yellow-200 font-semibold">Pro Active</p>
                  <p className="text-white/80 text-sm">
                    Thanks for supporting AniVault!
                  </p>
                </div>
              </div>
              <div className="text-sm text-white/70">
                <span className="font-medium">License:</span>{' '}
                <span className="font-mono">{maskedKey || 'N/A'}</span>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeactivate}
              disabled={isLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600/80 hover:bg-red-600 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              <AlertTriangle size={16} />
              {isLoading ? 'Processing...' : 'Deactivate License'}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="free-card"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg"
          >
            <label className="block text-sm font-medium text-white/80 mb-2" htmlFor="license-key">
              License Key
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                <input
                  id="license-key"
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full rounded-lg bg-black/30 border border-white/10 text-white px-10 py-2 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                />
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleActivate}
                disabled={isLoading || !inputKey.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {isLoading ? 'Activating...' : 'Activate Pro'}
              </motion.button>
            </div>
            {statusMessage && (
              <p className="mt-3 text-sm text-white/70">{statusMessage}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {import.meta.env.DEV && (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="tool">
                🛠️
              </span>
              <p className="font-semibold">Developer Debug</p>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDevToggle}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Force Toggle Pro Mode
            </motion.button>
          </div>
          <p className="mt-2 text-xs text-white/60">
            For testing only. Simulates switching Pro state locally.
          </p>
        </div>
      )}

      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
      />
    </div>
  )
}

export default LicenseSettings

