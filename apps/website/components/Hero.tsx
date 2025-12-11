'use client'

import { motion } from 'framer-motion'
import { Download, Play, Github } from 'lucide-react'

const Hero = () => {
  const scrollTo = (href: string) => {
    // Extract hash from href (e.g., '#features' from '#features')
    const hash = href.startsWith('#') ? href : `#${href.replace(/^#/, '')}`
    const element = document.querySelector(hash)
    if (element) {
      const yOffset = -80 // Account for fixed navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Text */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-sm text-purple-300"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            New • Automatic anime tracker
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight"
          >
            Your anime.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Tracked automatically.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl text-gray-400 max-w-xl leading-relaxed"
          >
            AniVault watches what you watch and updates your lists, stats, and Discord — no more
            manual episode updates.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                scrollTo('#features')
              }}
              className="group px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 flex items-center gap-2"
            >
              <Download size={20} />
              Download for Windows
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                scrollTo('#how-it-works')
              }}
              className="px-8 py-4 rounded-full glass-card text-white font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Play size={20} />
              Learn More
            </button>
          </motion.div>

          {/* Tiny text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-xs text-gray-500"
          >
            No account required. AniList login optional.
          </motion.p>

          {/* Ecosystem Tiles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            <div className="glass-card p-6 space-y-2">
              <h3 className="font-semibold text-white">Desktop App</h3>
              <p className="text-sm text-gray-400">
                Netflix-style media center with auto-tracking from local players like VLC, MPV, and more.
              </p>
            </div>
            <div className="glass-card p-6 space-y-2">
              <h3 className="font-semibold text-white">Browser Extension</h3>
              <p className="text-sm text-gray-400">
                Chrome extension that detects anime on streaming sites (Crunchyroll, Zoro, Netflix, etc.) and sends progress directly into AniVault.
              </p>
            </div>
            <div className="glass-card p-6 space-y-2">
              <h3 className="font-semibold text-white">Website</h3>
              <p className="text-sm text-gray-400">
                Clean landing page and docs hub — download AniVault, learn features, and stay updated.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column - Floating Cards */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative h-[600px] flex items-center justify-center"
        >
          {/* Halo gradient */}
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-pink-500/20 to-transparent rounded-full blur-3xl" />

          {/* Large Library Card */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute z-10 w-80 h-96 glass-card p-6 rotate-[-3deg] shadow-2xl"
          >
            <div className="h-full rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">My Library</h3>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 w-24 bg-white/20 rounded" />
                      <div className="h-2 w-16 bg-white/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Detection Card */}
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-20 right-0 z-20 w-64 glass-card p-4 rotate-[2deg] shadow-xl"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-gray-400">Detected</span>
              </div>
              <p className="text-sm font-semibold text-white">Jujutsu Kaisen</p>
              <p className="text-xs text-gray-400">Episode 5</p>
            </div>
          </motion.div>

          {/* Discord Presence Card */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-20 left-0 z-20 w-56 glass-card p-3 rotate-[-2deg] shadow-xl"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500" />
                <span className="text-xs text-gray-400">Discord</span>
              </div>
              <p className="text-xs text-white">Watching: One Piece</p>
              <p className="text-xs text-gray-500">Ep 1070 / 1100</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero

