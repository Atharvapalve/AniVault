'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import GlowCard from './GlowCard'

const Pricing = () => {
  return (
    <section id="pro" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            AniVault Pro — Coming Soon
          </h2>
          <p className="text-sm text-purple-400 mb-2">(Test Mode)</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Pitch */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <p className="text-lg text-gray-300 leading-relaxed">
              AniVault Pro is for power users. Organize your library, flex on Discord, and dive into
              advanced stats. We're currently testing Pro with a small group of users.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Check className="w-5 h-5 text-purple-400" />
                <span>All Pro features listed above</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Check className="w-5 h-5 text-purple-400" />
                <span>Future Pro perks & updates</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Check className="w-5 h-5 text-purple-400" />
                <span>Early access to new features</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <GlowCard className="p-8 border-2 border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative space-y-6">
                <div>
                  <div className="text-5xl font-display font-bold mb-2">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Pricing TBA
                    </span>
                  </div>
                  <p className="text-gray-400">Public Pro access coming soon</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <button
                    disabled
                    className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold opacity-50 cursor-not-allowed"
                  >
                    Join Pro Test (Soon)
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const element = document.querySelector('#features')
                      if (element) {
                        const yOffset = -80 // Account for fixed navbar
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                        window.scrollTo({ top: y, behavior: 'smooth' })
                      }
                    }}
                    className="w-full px-6 py-3 rounded-full glass-card text-white font-semibold hover:bg-white/10 transition-all"
                  >
                    Stay on Free
                  </button>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Pricing

