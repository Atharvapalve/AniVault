import Head from 'next/head'
import CTA from '../components/CTA'
import Pricing from '../components/Pricing'
import { CHECKOUT_PROD, CHECKOUT_SANDBOX, CHECKOUT_URL, DOWNLOAD_URL, SITE_URL } from '../lib/links'

export default function PricingPage() {
  const checkoutUrl = CHECKOUT_PROD || CHECKOUT_URL
  const sandboxUrl = CHECKOUT_SANDBOX

  return (
    <>
      <Head>
        <title>AniVault Pricing — Free vs Pro</title>
        <meta
          name="description"
          content="Choose AniVault Free for automatic tracking or upgrade to Pro for Auto Organizer, advanced stats, and premium themes."
        />
        <link rel="canonical" href={`${SITE_URL}/pricing`} />
      </Head>
      <div className="pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-sm uppercase tracking-wide text-purple-200">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold">Free forever. Pro when ready.</h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Lemon Squeezy hosted checkout keeps payment data off our stack. Use the sandbox link to submit
            verification proof, then flip to production when you are ready.
          </p>
        </div>

        <Pricing checkoutUrl={checkoutUrl} sandboxUrl={sandboxUrl} />

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="glass-card p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-display font-semibold">How to redeem your license</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Click a pricing button. A Lemon Squeezy hosted checkout opens in a new tab.</li>
              <li>Complete the purchase. Copy the license key from the receipt email or checkout success.</li>
              <li>Open AniVault desktop → Settings → License → Paste key → Activate.</li>
            </ol>
            <p className="text-sm text-gray-400">
              Sandboxed purchases are for testing only. Switch the environment variables to production to
              go live.
            </p>
          </div>
        </section>

        <CTA downloadUrl={DOWNLOAD_URL} checkoutUrl={checkoutUrl} />
      </div>
    </>
  )
}
