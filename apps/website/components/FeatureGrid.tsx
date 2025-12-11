'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  PlayCircle,
  Library,
  Link2,
  User,
  BarChart3,
  FolderTree,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Palette,
  MonitorPlay,
} from 'lucide-react'
import GlowCard from './GlowCard'

const features = [
  {
    category: 'free',
    icon: PlayCircle,
    title: 'Auto-tracking',
    description: 'Watches your local media players and detects what you\'re watching automatically.',
  },
  {
    category: 'free',
    icon: MonitorPlay,
    title: 'Browser Auto-Tracking',
    description:
      'AniVault Chrome Extension watches your anime on streaming sites and forwards episodes to the desktop app — no more manually updating progress.',
  },
  {
    category: 'free',
    icon: Library,
    title: 'AniVault Library',
    description: 'Beautiful media center UI to browse and manage your anime collection.',
  },
  {
    category: 'free',
    icon: Link2,
    title: 'AniList Sync',
    description: 'Connect your AniList account to sync your library and progress online.',
  },
  {
    category: 'free',
    icon: User,
    title: 'Guest Mode',
    description: 'Use AniVault completely offline. No account required.',
  },
  {
    category: 'free',
    icon: BarChart3,
    title: 'Basic Stats',
    description: 'Track episodes watched, hours, and genre breakdowns.',
  },
  {
    category: 'pro',
    icon: FolderTree,
    title: 'Auto Organizer',
    description:
      'One click to turn messy downloads into organized folders. [SubsPlease] Jujutsu Kaisen - 05.mkv → D:\\Anime\\Jujutsu Kaisen\\Season 1\\Jujutsu Kaisen - Episode 05.mkv',
  },
  {
    category: 'pro',
    icon: Sparkles,
    title: 'Mood-Based Recommendations',
    description: 'Pick a mood — hype, cozy, emotional, mind-bending — and AniVault finds the perfect show.',
  },
  {
    category: 'pro',
    icon: MessageSquare,
    title: 'Discord Presence Pro+',
    description: 'Show what you\'re watching, binge stats, and your current vibe directly on Discord.',
  },
  {
    category: 'pro',
    icon: TrendingUp,
    title: 'Advanced Stats & Heatmaps',
    description: 'See your watch history as a contribution graph, binge sessions, and yearly Wrapped-style summaries.',
  },
  {
    category: 'pro',
    icon: Palette,
    title: 'Premium Themes',
    description: 'Neon, midnight, vaporwave — customize AniVault to match your setup.',
  },
]

const FeatureGrid = () => {
  const [filter, setFilter] = useState<'all' | 'free' | 'pro'>('all')

  const filteredFeatures =
    filter === 'all' ? features : features.filter((f) => f.category === filter)

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">Features</h2>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center gap-3 mb-12"
        >
          {(['all', 'free', 'pro'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'glass-card text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <GlowCard key={feature.title} delay={index * 0.1} className="p-6 relative">
                {feature.category === 'pro' && (
                  <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-semibold text-white">
                    PRO
                  </div>
                )}
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
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

