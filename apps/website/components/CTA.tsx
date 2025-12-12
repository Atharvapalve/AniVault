import { Rocket } from 'lucide-react'
import Link from 'next/link'

type CTAProps = {
  downloadUrl: string
  checkoutUrl?: string
}

const CTA = ({ downloadUrl, checkoutUrl }: CTAProps) => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto glass-card p-10 md:p-14 text-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-purple-200">
            <Rocket className="w-4 h-4" aria-hidden="true" />
            Ready to track everything automatically
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Stop manually updating episodes. Let AniVault do it for you.
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Download the Windows app, add the Chrome extension, and connect AniList in under five minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Link
              href={downloadUrl}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/40 hover:translate-y-[-2px] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300"
            >
              Download for Windows
            </Link>
            {checkoutUrl ? (
              <Link
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 rounded-full border border-white/15 text-white font-semibold hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-300"
              >
                Get Pro via Lemon Squeezy
              </Link>
            ) : (
              <Link
                href="/#pricing"
                className="px-8 py-4 rounded-full border border-white/15 text-white font-semibold hover:bg-white/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-300"
              >
                View Pricing
              </Link>
            )}
          </div>
          <p className="text-sm text-gray-400">
            No cloud lock-in. Guest mode available. Works with VLC, MPV, local files, and major streaming
            sites via the extension.
          </p>
        </div>
      </div>
    </section>
  )
}

export default CTA





