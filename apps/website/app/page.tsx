import NavBar from '@/components/NavBar'
import Hero from '@/components/Hero'
import HowItWorks from '@/components/HowItWorks'
import FeatureGrid from '@/components/FeatureGrid'
import Pricing from '@/components/Pricing'
import Screenshots from '@/components/Screenshots'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="relative z-10">
      <NavBar />
      <Hero />
      <HowItWorks />
      <FeatureGrid />
      <Pricing />
      <Screenshots />
      <FAQ />
      <Footer />
    </main>
  )
}

