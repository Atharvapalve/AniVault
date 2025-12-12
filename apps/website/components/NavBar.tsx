'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const navItems = [
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Screenshots', href: '/#screenshots' },
]

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-xl bg-black/70 border-b border-white/10 shadow-lg'
          : 'backdrop-blur-md bg-black/30 border-b border-white/5'
      }`}
      aria-label="Primary"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="AniVault home"
          >
            <Image
              src="/press-kit/logo-mark.png"
              alt="AniVault logo"
              width={36}
              height={36}
              className="rounded-lg shadow-lg shadow-purple-500/30"
              priority
            />
            <span className="text-xl font-display font-bold tracking-tight">AniVault</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Link
                  href={item.href}
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 rounded-md px-1 py-0.5"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/#download"
              scroll
              className="hidden sm:inline-flex px-4 py-2 rounded-full border border-white/15 text-sm font-semibold text-white hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
            >
              Download
            </Link>
            <Link
              href="/#pricing"
              scroll
              className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400"
            >
              Get Pro
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default NavBar

