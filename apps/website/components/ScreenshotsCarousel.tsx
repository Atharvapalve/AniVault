'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Slide = {
  title: string
  description: string
  image: string
}

const slides: Slide[] = [
  {
    title: 'Desktop Dashboard',
    description: 'Track local files, Discord presence, and stats at a glance.',
    image: '/press-kit/screenshot-desktop.png',
  },
  {
    title: 'Chrome Extension',
    description: 'Detects anime on streaming sites and sends progress to the app.',
    image: '/press-kit/screenshot-extension.png',
  },
  {
    title: 'Auto Organizer',
    description: 'One click to clean filenames and folder structure.',
    image: '/press-kit/screenshot-organizer.png',
  },
]

const ScreenshotsCarousel = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((prev) => (prev + 1) % slides.length), 5000)
    return () => clearInterval(id)
  }, [])

  const prev = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length)
  const next = () => setIndex((prev) => (prev + 1) % slides.length)

  return (
    <section id="screenshots" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-sm uppercase tracking-wide text-purple-300">Screenshots</p>
          <h2 className="text-4xl font-display font-bold">See AniVault in action</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Desktop + extension working together. Swap these with the latest captures before submitting to
            Lemon Squeezy for verification.
          </p>
        </div>

        <div className="relative glass-card overflow-hidden border-white/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={slides[index].title}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="p-6 md:p-10"
              aria-live="polite"
            >
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <img
                  src={slides[index].image}
                  alt={slides[index].title}
                  className="w-full rounded-xl border border-white/10 shadow-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10"
                  loading="lazy"
                />
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-semibold">{slides[index].title}</h3>
                  <p className="text-gray-300 leading-relaxed">{slides[index].description}</p>
                  <div className="flex items-center gap-2" aria-label="Screenshot progress">
                    {slides.map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-8 rounded-full transition-all ${
                          i === index ? 'bg-purple-400' : 'bg-white/10'
                        }`}
                        aria-hidden={i !== index}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default ScreenshotsCarousel
