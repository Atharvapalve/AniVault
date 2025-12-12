import Head from 'next/head'
import CTA from '../components/CTA'
import FeatureGrid from '../components/FeatureGrid'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import Pricing from '../components/Pricing'
import ScreenshotsCarousel from '../components/ScreenshotsCarousel'
import {
  CHECKOUT_PROD,
  CHECKOUT_SANDBOX,
  CHECKOUT_URL,
  DOWNLOAD_URL,
  EXTENSION_URL,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '../lib/links'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'AniVault',
  description: SITE_DESCRIPTION,
  brand: {
    '@type': 'Brand',
    name: 'AniVault',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/pricing`,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '124',
  },
}

export default function HomePage() {
  const checkoutUrl = CHECKOUT_PROD || CHECKOUT_URL
  const sandboxUrl = CHECKOUT_SANDBOX

  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <link rel="canonical" href={SITE_URL} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={`${SITE_URL}/og-image.svg`} />
        <meta property="og:url" content={SITE_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.svg`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <Hero downloadUrl={DOWNLOAD_URL} checkoutUrl={checkoutUrl} extensionUrl={EXTENSION_URL} />
      <FeatureGrid />
      <HowItWorks />
      <Pricing checkoutUrl={checkoutUrl} sandboxUrl={sandboxUrl} />
      <ScreenshotsCarousel />

      <section id="trust" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto glass-card p-8 md:p-10 grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Privacy by default',
              copy: 'Runs locally. No tracking scripts. Sync to AniList only if you turn it on.',
            },
            {
              title: 'Verified checkout',
              copy: 'Lemon Squeezy handles payments. Hosted checkout with data-product-id for auditing.',
            },
            {
              title: 'Accessible UI',
              copy: 'Keyboard-friendly buttons, labeled controls, and 4.5+ contrast for key text.',
            },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <h3 className="text-xl font-display font-semibold">{item.title}</h3>
              <p className="text-gray-300 leading-relaxed">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <div id="download">
        <CTA downloadUrl={DOWNLOAD_URL} checkoutUrl={checkoutUrl} />
      </div>
    </>
  )
}
