'use client'

import { motion } from 'framer-motion'

const Footer = () => {
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
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div className="space-y-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AV</span>
              </div>
              <span className="text-xl font-display font-bold">AniVault</span>
            </button>
            <p className="text-sm text-gray-400">
              Automatic anime tracker & media center for Windows.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button
                  onClick={() => {
                    // Placeholder - can be replaced with actual route later
                    alert('Privacy Policy page coming soon')
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    // Placeholder - can be replaced with actual route later
                    alert('Terms of Use page coming soon')
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Terms of Use
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href="mailto:support@anivault.app"
                  className="hover:text-white transition-colors"
                >
                  support@anivault.app
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Download</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    scrollTo('#features')
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Windows App
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    scrollTo('#features')
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Chrome Extension <span className="text-xs text-gray-500">(Developer Preview)</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500">
            Not affiliated with AniList, MyAnimeList, Crunchyroll, or any streaming platform.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

