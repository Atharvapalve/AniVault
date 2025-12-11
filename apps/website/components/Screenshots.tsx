'use client'

import { motion } from 'framer-motion'
import GlowCard from './GlowCard'

const screenshots = [
  {
    title: 'Library View',
    description: 'Beautiful media center interface',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    title: 'Stats Dashboard',
    description: 'Advanced analytics and insights',
    gradient: 'from-blue-500/20 to-purple-500/20',
  },
  {
    title: 'Discord Presence',
    description: 'Show off your anime journey',
    gradient: 'from-indigo-500/20 to-purple-500/20',
  },
  {
    title: 'Auto Organizer',
    description: 'Organize your downloads',
    gradient: 'from-pink-500/20 to-orange-500/20',
  },
]

const Screenshots = () => {
  return (
    <section id="screenshots" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            See AniVault in Action
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={screenshot.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, rotate: 2 }}
              className="cursor-pointer"
            >
              <GlowCard className="p-6 h-full">
                <div className={`aspect-video rounded-lg bg-gradient-to-br ${screenshot.gradient} border border-white/10 flex items-center justify-center mb-4`}>
                  <p className="text-xs text-gray-400 text-center px-4">
                    {screenshot.title}
                    <br />
                    Screenshot Coming Soon
                  </p>
                </div>
                <h3 className="font-semibold mb-1">{screenshot.title}</h3>
                <p className="text-sm text-gray-400">{screenshot.description}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Screenshots

