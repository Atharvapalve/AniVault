'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Shield, Zap } from 'lucide-react'
import GlowCard from './GlowCard'

type PricingProps = {
  checkoutUrl?: string
  sandboxUrl?: string
}

const parseProductId = (url?: string) => {
  if (!url) return ''
  try {
    const path = new URL(url).pathname
    const parts = path.split('/').filter(Boolean)
    return parts[parts.length - 1] || ''
  } catch {
    return ''
  }
}

const freeBenefits = [
  'Automatic desktop + browser tracking',
  'AniList sync + guest mode',
  'Discord Rich Presence',
  'Local-first storage, no cloud lock-in',
]

const proBenefits = [
  'Auto Organizer & metadata fixes',
  'Mood-based recommendations',
  'Advanced stats, heatmaps, and Wrapped',
  'Premium themes + extended Discord presence',
]

const Pricing = ({ checkoutUrl, sandboxUrl }: PricingProps) => {
  const primaryCheckout = checkoutUrl || sandboxUrl
  const actions = [
    checkoutUrl && {
      label: 'Buy Pro (Live)',
      url: checkoutUrl,
      tone: 'live',
      productId: parseProductId(checkoutUrl),
    },
    sandboxUrl && {
      label: 'Test Checkout (Sandbox)',
      url: sandboxUrl,
      tone: 'sandbox',
      productId: parseProductId(sandboxUrl),
    },
  ].filter(Boolean) as { label: string; url: string; tone: 'live' | 'sandbox'; productId: string }[]

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-3"
        >
          <p className="text-sm uppercase tracking-wide text-purple-200">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-display font-bold">Choose your flow</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Stay on Free forever or upgrade to Pro for power features. Lemon Squeezy checkout opens in
            a secure tab.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          <GlowCard className="p-8 space-y-6 border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-green-300">Free</p>
                <h3 className="text-3xl font-display font-bold">Starter</h3>
                <p className="text-gray-400">Everything you need to ditch manual updates.</p>
              </div>
              <Shield className="w-10 h-10 text-green-300" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {freeBenefits.map((item) => (
                <div key={item} className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/#download"
              className="w-full inline-flex justify-center px-6 py-3 rounded-full border border-white/15 text-white font-semibold hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
            >
              Download free
            </Link>
            <p className="text-xs text-gray-400 text-center">
              Installer includes the Chrome extension helper. You can stay in guest mode forever.
            </p>
          </GlowCard>

          <GlowCard className="p-8 space-y-6 border-2 border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/25 rounded-full blur-2xl -mr-16 -mt-16" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm uppercase tracking-wide text-purple-200">Pro</p>
                <h3 className="text-3xl font-display font-bold">Creator</h3>
                <p className="text-gray-400">For collectors and binge pros.</p>
                {!checkoutUrl && sandboxUrl && (
                  <p className="text-xs text-purple-200 mt-1">Sandbox checkout for verification</p>
                )}
              </div>
              <Zap className="w-10 h-10 text-purple-300" aria-hidden="true" />
            </div>
            <div className="space-y-3 relative">
              {proBenefits.map((item) => (
                <div key={item} className="flex items-start gap-3 text-gray-200">
                  <Check className="w-5 h-5 text-purple-300 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {actions.length > 0 ? (
                actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.url}
                    target="_blank"
                    rel="noreferrer"
                    data-product-id={action.productId || undefined}
                    className={`w-full inline-flex justify-center px-6 py-3 rounded-full text-white font-semibold shadow-lg hover:-translate-y-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400 ${
                      action.tone === 'live'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/40'
                        : 'bg-white/10 border border-white/20 text-purple-50'
                    }`}
                  >
                    {action.label}
                  </Link>
                ))
              ) : (
                <Link
                  href="mailto:support@anivault.app?subject=AniVault%20Pro%20Request"
                  className="w-full inline-flex justify-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/40 hover:-translate-y-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-400"
                >
                  Request Pro access
                </Link>
              )}
              <p className="text-xs text-gray-300 text-center leading-relaxed">
                After purchase, copy the license key from your Lemon Squeezy receipt and paste it in
                AniVault desktop: Settings → License. Need help?{' '}
                <Link href="mailto:support@anivault.app" className="text-purple-200 underline">
                  support@anivault.app
                </Link>
                .
              </p>
            </div>
            {primaryCheckout && (
              <p className="text-[11px] text-gray-400 text-center">
                Hosted checkout handled by Lemon Squeezy. No payment data touches AniVault servers.
              </p>
            )}
          </GlowCard>
        </div>
      </div>
    </section>
  )
}

export default Pricing

