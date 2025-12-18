'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowUpRight, Download, Play, ShieldCheck } from 'lucide-react'

type HeroProps = {
  downloadUrl: string
  checkoutUrl?: string
  extensionUrl?: string
}

const Hero = ({ downloadUrl, checkoutUrl, extensionUrl }: HeroProps) => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.08),transparent_40%),radial-gradient(circle_at_20%_20%,_rgba(236,72,153,0.08),transparent_35%)]" />
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-sm text-purple-200">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            Local-first • No cloud lock-in
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight">
            Just press play.
            <span className="block bg-gradient-to-r from-purple-300 via-pink-300 to-blue-200 bg-clip-text text-transparent">
              AniVault does the rest.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed">
            Whether you&apos;re watching locally or streaming online, AniVault auto-tracks every episode,
            syncs your list, and builds beautiful stats — while you enjoy your anime, not manage it.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href={downloadUrl}
              className="group px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300"
            >
              <Download size={20} aria-hidden="true" />
              Download for Windows
            </Link>
            <Link
              href={checkoutUrl || '/#pricing'}
              target={checkoutUrl ? '_blank' : undefined}
              rel={checkoutUrl ? 'noreferrer' : undefined}
              className="px-8 py-4 rounded-full glass-card text-white font-semibold hover:bg-white/10 transition-all inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-300"
            >
              {checkoutUrl ? 'Get Pro' : 'View Pricing'}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <p className="text-sm text-gray-400 flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-green-400" aria-hidden="true" />
              No account required — guest mode ready
            </span>
            <span aria-hidden="true">•</span>
            <span>Works with VLC, MPV, Plex, and browser tabs via extension</span>
            {extensionUrl && (
              <>
                <span aria-hidden="true">•</span>
                <Link
                  href={extensionUrl}
                  className="text-purple-200 underline underline-offset-4 hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  Chrome extension
                </Link>
              </>
            )}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Detect',
                copy: 'Parses filenames and streaming sites in real-time. No regex config needed.',
              },
              {
                title: 'Sync',
                copy: 'Push progress to AniList instantly or stay fully offline in guest mode.',
              },
              {
                title: 'Flex',
                copy: 'Discord Rich Presence shows title, episode, and binge streaks.',
              },
            ].map((item) => (
              <div key={item.title} className="glass-card p-4 space-y-1">
                <p className="text-xs uppercase tracking-wide text-purple-200">{item.title}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{item.copy}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative ml-8 lg:ml-12"
          aria-label="AniVault interface preview"
        >
          <div className="absolute -inset-8 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-blue-500/10 blur-[80px]" />
          <div className="relative glass-card overflow-hidden border-white/20 shadow-2xl max-w-[90%]">
            <img
              src="/press-kit/maxresdefault.jpg"
              alt="AniVault desktop showing library and playback detection"
              className="w-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-3 right-3 glass-card px-3 py-2 rounded-lg text-xs text-white space-y-0.5 max-w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-300">Live detection</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
              </div>
              <p className="font-semibold text-xs">Jujutsu Kaisen — Episode 28</p>
              <p className="text-gray-300 text-[10px]">Synced to AniList • Discord Presence on</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero

