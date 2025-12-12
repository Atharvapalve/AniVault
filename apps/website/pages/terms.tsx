import Head from 'next/head'
import { SITE_URL } from '../lib/links'

export default function TermsPage() {
  const lastUpdated = '2025-12-12'

  return (
    <>
      <Head>
        <title>Terms of Use — AniVault</title>
        <meta name="description" content="Terms of Use for AniVault desktop app, extension, and website." />
        <link rel="canonical" href={`${SITE_URL}/terms`} />
      </Head>
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-display font-bold">Terms of Use</h1>
        <p className="text-gray-300">
          By using AniVault (desktop app, browser extension, or website), you agree to these terms.
          If you do not agree, please uninstall the app and extension.
        </p>
        <div className="space-y-6 text-gray-300">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">License</h2>
            <p>
              You receive a personal, non-transferable license to use the software. Pro licenses are
              issued via Lemon Squeezy and tied to the purchase email/license key.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Acceptable use</h2>
            <p>Do not abuse, reverse engineer, or use AniVault to violate third-party platform terms.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Updates</h2>
            <p>
              We may ship updates automatically. Features can change; we aim to keep compatibility with
              major players and AniList.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Liability</h2>
            <p>
              AniVault is provided “as is.” To the fullest extent permitted by law, we are not liable
              for indirect or consequential damages.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Contact</h2>
            <p>
              For questions, email{' '}
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





