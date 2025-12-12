import Head from 'next/head'
import { SITE_URL } from '../lib/links'

export default function PrivacyPage() {
  const lastUpdated = '2025-12-12'

  return (
    <>
      <Head>
        <title>Privacy Policy — AniVault</title>
        <meta
          name="description"
          content="Privacy policy for AniVault. Learn what we collect (very little), how we store data locally, and how to reach support."
        />
        <link rel="canonical" href={`${SITE_URL}/privacy`} />
      </Head>
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-display font-bold">Privacy Policy</h1>
        <p className="text-gray-300">
          We design AniVault to be local-first. The desktop app stores your library on your machine.
          You can connect AniList to sync progress, but guest mode works fully offline.
        </p>
        <div className="space-y-6 text-gray-300">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">What we collect</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Local library data and viewing history stay on your device.</li>
              <li>AniList tokens are stored locally and only sent to AniList when syncing.</li>
              <li>No analytics are sent unless you enable them via environment/DSN config.</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Third-party services</h2>
            <p>
              If enabled, we may use optional analytics (Plausible/GA) and crash reporting (Sentry).
              These are off by default. Lemon Squeezy handles checkout and processes payment data on
              their hosted pages.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Data retention</h2>
            <p>Your AniVault data lives locally. Remove the app to remove the data.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Security</h2>
            <p className="text-gray-300">
              Payments and licensing are handled by Lemon Squeezy via hosted checkout. AniVault never stores
              your card data.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Contact</h2>
            <p>
              For privacy questions or data requests, email{' '}
              <a href="mailto:support@anivault.app" className="text-purple-300 underline">
                support@anivault.app
              </a>
              .
            </p>
          </section>
          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>
      </div>
    </>
  )
}





