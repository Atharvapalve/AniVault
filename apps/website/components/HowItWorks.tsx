'use client'

import { motion } from 'framer-motion'
import { MonitorPlay, PlugZap, Search, Shield } from 'lucide-react'
import GlowCard from './GlowCard'

const steps = [
  {
    icon: Search,
    title: 'Install',
    description: 'Install AniVault for Windows. It watches VLC/MPV window titles locally — nothing leaves your PC.',
  },
  {
    icon: PlugZap,
    title: 'Connect',
    description:
      'Pair the Chrome extension and optionally connect AniList. Guest mode works with no account or telemetry.',
  },
  {
    icon: MonitorPlay,
    title: 'Watch',
    description:
      'Hit play. AniVault detects episodes from local files and streaming tabs and syncs progress instantly.',
  },
  {
    icon: Shield,
    title: 'Sync safely',
    description: 'Lemon Squeezy handles checkout. AniVault stores licenses locally and never sees your card.',
  },
]

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">How AniVault Works</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Three steps: install, connect extension/AniList, and watch. The rest is fully automated.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <GlowCard key={step.title} delay={index * 0.2} className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-bold">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
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

export default HowItWorks

