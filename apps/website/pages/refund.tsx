import Head from 'next/head'
import { SITE_URL } from '../lib/links'

export default function RefundPage() {
  const lastUpdated = '2025-12-12'

  return (
    <>
      <Head>
        <title>Refund Policy — AniVault</title>
        <meta name="description" content="Refund policy for AniVault Pro purchases via Lemon Squeezy." />
        <link rel="canonical" href={`${SITE_URL}/refund`} />
      </Head>
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-display font-bold">Refund Policy</h1>
        <p className="text-gray-300">
          We want you to love AniVault. If you have issues activating or using Pro features, reach out
          and we will help or refund.
        </p>
        <div className="space-y-6 text-gray-300">
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Eligibility</h2>
            <p>
              Refunds are available within 14 days of purchase for licenses bought via Lemon Squeezy if
              you experience activation problems or the product does not work as advertised.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">How to request</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Reply to your Lemon Squeezy receipt email or email anivault.one@gmail.com.</li>
              <li>Include your order ID and the issue you faced.</li>
              <li>We will respond within 2 business days.</li>
            </ol>
          </section>
          <section className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">Subscriptions</h2>
            <p>
              If subscriptions are offered in the future, you can cancel anytime before renewal in
              your Lemon Squeezy customer portal.
            </p>
          </section>
          <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
        </div>
      </div>
    </>
  )
}





