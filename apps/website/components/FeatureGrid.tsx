'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  BarChart3,
  Fingerprint,
  FolderTree,
  Library,
  Link2,
  MessageSquare,
  MonitorPlay,
  Palette,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import GlowCard from './GlowCard'

const features = [
  {
    category: 'free',
    icon: PlayCircle,
    title: 'Auto-tracking engine',
    description:
      'Watches VLC, MPV, Plex, and window titles in real time. No manual episode typing, ever.',
  },
  {
    category: 'free',
    icon: MonitorPlay,
    title: 'Chrome extension detection',
    description:
      'Detects Crunchyroll, Netflix, Zoro, and more. Episodes are pushed to the desktop app instantly.',
  },
  {
    category: 'free',
    icon: Link2,
    title: 'AniList sync or offline',
    description: 'Stay offline in guest mode or connect AniList to sync automatically.',
  },
  {
    category: 'free',
    icon: Library,
    title: 'Library & queue',
    description: 'Browse, filter, and prioritize what to watch with a neon glass UI.',
  },
  {
    category: 'free',
    icon: ShieldCheck,
    title: 'Privacy-first',
    description: 'No cloud lock-in. Data stays on disk unless you connect AniList.',
  },
  {
    category: 'free',
    icon: BarChart3,
    title: 'Session stats',
    description: 'Track runtime, streaks, and genre balance. Wrapped-style recaps are built-in.',
  },
  {
    category: 'pro',
    icon: FolderTree,
    title: 'Auto Organizer',
    description:
      'One click cleans filenames and folders: "[SubsPlease] JJK - 05.mkv" → "D:/Anime/JJK/S01/E05.mkv".',
  },
  {
    category: 'pro',
    icon: Sparkles,
    title: 'Mood-based picks',
    description: 'Pick a vibe — hype, cozy, emotional — and AniVault suggests the next title.',
  },
  {
    category: 'pro',
    icon: MessageSquare,
    title: 'Discord Presence Pro',
    description: 'Broadcast what you watch with episode, ETA, and binge streak data.',
  },
  {
    category: 'pro',
    icon: TrendingUp,
    title: 'Advanced insights',
    description: 'Contribution graphs, heatmaps, and per-season stats for completionists.',
  },
  {
    category: 'pro',
    icon: Palette,
    title: 'Premium themes',
    description: 'Cyberpunk glass, midnight synth, vaporwave gradients, and custom accent control.',
  },
  {
    category: 'pro',
    icon: Fingerprint,
    title: 'Trusted telemetry',
    description: 'Optional, anonymized error reporting via Sentry toggle. Off by default.',
  },
]

const FeatureGrid = () => {
  const [filter, setFilter] = useState<'all' | 'free' | 'pro'>('all')
  const filteredFeatures = filter === 'all' ? features : features.filter((f) => f.category === filter)

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <p className="text-sm uppercase tracking-wide text-purple-200">Built for binge-watchers</p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold">Everything updates itself</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Local-first tracking with pro-grade automation. Flip between Free and Pro to see what ships
            today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center gap-3"
        >
          {(['all', 'free', 'pro'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 ${
                filter === option
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/40'
                  : 'glass-card text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              aria-pressed={filter === option}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <GlowCard key={feature.title} delay={index * 0.08} className="p-6 relative">
                {feature.category === 'pro' && (
                  <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-semibold text-white">
                    PRO
                  </span>
                )}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-purple-300" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold">{feature.title}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </GlowCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeatureGrid

