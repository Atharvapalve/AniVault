import type { ReactNode } from 'react'
import NavBar from './NavBar'
import Footer from './Footer'

type Props = {
  children: ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05060b] via-[#0d0f1a] to-[#0b0d17] text-white relative overflow-hidden">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded-lg focus:outline focus:outline-2 focus:outline-purple-400"
      >
        Skip to content
      </a>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-[-6rem] w-[28rem] h-[28rem] bg-pink-500/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10rem] left-10 w-[22rem] h-[22rem] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>
      <NavBar />
      <main id="content" className="relative z-10 pt-16">{children}</main>
      <Footer />
      <div className="noise-overlay" />
    </div>
  )
}

export default Layout





