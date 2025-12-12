'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CONTACT_EMAIL, DOWNLOAD_URL, EXTENSION_URL } from '../lib/links'

const Footer = () => {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/press-kit/logo-mark.png"
                alt="AniVault logo"
                width={32}
                height={32}
                className="rounded-lg shadow-md shadow-purple-500/30"
              />
              <span className="text-xl font-display font-bold">AniVault</span>
            </Link>
            <p className="text-sm text-gray-400">
              Automatic anime tracker & media center for Windows. Local-first with zero cloud lock-in.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#download" className="hover:text-white transition-colors">
                  Download
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={DOWNLOAD_URL} className="hover:text-white transition-colors">
                  Windows Installer
                </a>
              </li>
              <li>
                <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Chrome Extension
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 text-center space-y-2">
          <p className="text-xs text-gray-500">
            Not affiliated with AniList, MyAnimeList, Crunchyroll, or any streaming platform.
          </p>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} AniVault. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

