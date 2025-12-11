'use client'

import { motion } from 'framer-motion'
import { Search, Brain, RefreshCw, MonitorPlay } from 'lucide-react'
import GlowCard from './GlowCard'

const steps = [
  {
    icon: Search,
    title: 'Detect',
    description:
      'AniVault looks at your open windows and media players. When it sees something like "One Piece – 1070.mkv" or "Naruto S02E10" it knows exactly what you\'re watching.',
  },
  {
    icon: Brain,
    title: 'Understand',
    description:
      'A filename parser and AniList\'s database work together to detect the title and episode, even through messy fansub filenames.',
  },
  {
    icon: MonitorPlay,
    title: 'Stream',
    description:
      'If you\'re watching on Crunchyroll, Zoro, Netflix or other streaming sites, the AniVault Chrome Extension detects episodes in your browser and relays them to the desktop app.',
  },
  {
    icon: RefreshCw,
    title: 'Sync',
    description:
      'Your library updates automatically. If you connect AniList, your online profile syncs too — without you opening a browser.',
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
            AniVault isn't another list website. It's a local app that watches your players and browser,
            then updates everything for you — on your PC and on AniList.
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

