import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AniVault — Automatic Anime Tracker & Media Center',
  description:
    'AniVault automatically tracks your anime, syncs with AniList, shows beautiful stats, and can even organize your local library. Free tier + Pro features for power users.',
  openGraph: {
    title: 'AniVault — Automatic Anime Tracker & Media Center',
    description:
      'AniVault automatically tracks your anime, syncs with AniList, shows beautiful stats, and can even organize your local library.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AniVault — Automatic Anime Tracker & Media Center',
    description:
      'AniVault automatically tracks your anime, syncs with AniList, shows beautiful stats, and can even organize your local library.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="noise-overlay" />
        <div className="fixed inset-0 -z-10">
          {/* Aurora gradient backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl opacity-40 animate-float" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '4s' }} />
        </div>
        {children}
      </body>
    </html>
  )
}

