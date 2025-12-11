import { motion } from 'framer-motion'
import { Sparkles, Info } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store/useStore'

const WelcomeScreen = () => {
  const login = useStore((state) => state.login)
  const enableGuestMode = useStore((state) => state.enableGuestMode)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleConnect = async () => {
    try {
      setIsLoggingIn(true)
      await login()
    } catch (error) {
      console.error('Failed to connect:', error)
      // Error is already handled gracefully - user cancelled
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleGuestMode = () => {
    enableGuestMode()
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#050505] text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-blue-900/20 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-2xl px-6"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-violet-500/50">
            <Sparkles size={48} className="text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-blue-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite]"
        >
          AniVault
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-400 mb-12"
        >
          Your ultimate anime tracking ecosystem
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConnect}
            disabled={isLoggingIn}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg text-white font-semibold text-lg shadow-lg shadow-violet-500/50 hover:shadow-xl hover:shadow-violet-500/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? 'Connecting...' : 'Login with AniList'}
          </motion.button>

          {/* Guest Mode Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGuestMode}
            className="px-8 py-4 rounded-lg text-white font-semibold text-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all"
          >
            Continue as Guest
          </motion.button>
        </motion.div>

        {/* Why Login Tooltip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 relative inline-block"
        >
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Info size={16} />
            <span>Why Login?</span>
          </button>

          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg z-50"
            >
              <h4 className="font-semibold mb-2 text-violet-400">Cloud Sync Features</h4>
              <ul className="text-xs text-gray-300 space-y-1 text-left">
                <li>• Sync your library across devices</li>
                <li>• Automatic progress tracking</li>
                <li>• Access your AniList data</li>
                <li>• Real-time updates</li>
              </ul>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/10" />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default WelcomeScreen
