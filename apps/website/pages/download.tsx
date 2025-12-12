import Head from 'next/head'
import { ArrowDownToLine, Globe2, ShieldCheck } from 'lucide-react'
import CTA from '../components/CTA'
import { DOWNLOAD_URL, EXTENSION_URL, SITE_URL } from '../lib/links'

const checks = [
  'Requires Windows 10/11',
  'VLC or MPV recommended for local detection',
  'Chrome/Edge for extension auto-tracking',
  'Guest mode works without AniList',
]

export default function DownloadPage() {
  return (
    <>
      <Head>
        <title>Download AniVault — Windows App & Chrome Extension</title>
        <meta
          name="description"
          content="Download AniVault for Windows and the Chrome extension. Auto-track anime from local players and streaming sites. Guest mode included."
        />
        <link rel="canonical" href={`${SITE_URL}/download`} />
      </Head>

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-wide text-purple-200">Downloads</p>
          <h1 className="text-4xl font-display font-bold">AniVault for Windows</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Grab the latest Windows installer and pair it with the Chrome extension for full auto-tracking. No
            cloud lock-in — all data stays on your PC unless you connect AniList.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-8 space-y-4">
            <div className="flex items-center gap-3">
              <ArrowDownToLine className="w-6 h-6 text-purple-300" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold">Windows Installer</p>
                <p className="text-gray-400 text-sm">Signed installer with auto-updates</p>
              </div>
            </div>
            <a
              href={DOWNLOAD_URL}
              className="inline-flex justify-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/40 hover:-translate-y-0.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400"
            >
              Download for Windows
            </a>
            <ul className="space-y-2 text-sm text-gray-300">
              {checks.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="extension" className="glass-card p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Globe2 className="w-6 h-6 text-purple-300" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold">Chrome Extension</p>
                <p className="text-gray-400 text-sm">Detects episodes on streaming sites</p>
              </div>
            </div>
            <a
              href={EXTENSION_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex justify-center px-6 py-3 rounded-full border border-white/15 text-white font-semibold hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-300"
            >
              Open in Chrome Web Store
            </a>
            <p className="text-sm text-gray-400">
              After installing, open the desktop app → Settings → Extension and confirm the connection.
            </p>
          </div>
        </div>

        <section className="glass-card p-6 space-y-3">
          <h2 className="text-xl font-display font-semibold">Fast start checklist</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Install AniVault for Windows.</li>
            <li>Install the Chrome extension and keep it enabled.</li>
            <li>Open AniVault → Settings → Extension → Pair extension.</li>
            <li>Optionally connect AniList. Guest mode works out of the box.</li>
          </ol>
        </section>

        <CTA downloadUrl={DOWNLOAD_URL} />
      </div>
    </>
  )
}





