import { Download, Sparkles } from 'lucide-react'
import { Button } from '@anivault/ui'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-blue-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-violet-400 via-blue-400 to-violet-600 bg-clip-text text-transparent animate-glow">
            AniVault
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4">
            The Ultimate Anime Ecosystem
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Track, discover, and sync your anime across desktop, browser, and streaming platforms.
            Built for the modern anime enthusiast.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href="#download"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-blue-500 rounded-lg font-semibold text-white hover:from-violet-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-violet-500/50 hover:shadow-violet-500/80 hover:scale-105"
          >
            <Download size={20} className="group-hover:translate-y-1 transition-transform" />
            Download for Windows
          </a>
          <a
            href="#features"
            className="px-8 py-4 border border-white/20 rounded-lg font-semibold text-white hover:bg-white/5 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
          >
            Learn More
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="p-6 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
              <Sparkles className="text-violet-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Desktop App</h3>
            <p className="text-gray-400 text-sm">
              Netflix-style media center with automatic tracking from local players
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <Sparkles className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Browser Extension</h3>
            <p className="text-gray-400 text-sm">
              Seamlessly track anime on Crunchyroll, Netflix, and more
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
              <Sparkles className="text-violet-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sync Everywhere</h3>
            <p className="text-gray-400 text-sm">
              Your progress syncs across all devices in real-time
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

