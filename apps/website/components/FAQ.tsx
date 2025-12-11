'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import GlowCard from './GlowCard'

const faqs = [
  {
    question: 'Is AniVault free?',
    answer:
      'AniVault has a generous free tier with auto-tracking, library, and basic stats. AniVault Pro adds Organizer, advanced stats, Discord Presence Pro+, mood-based recommendations, and more.',
  },
  {
    question: 'Do I need an AniList account?',
    answer:
      'No. You can use AniVault in Guest mode without any account. AniList is only required if you want to sync your online list.',
  },
  {
    question: 'Does AniVault work with streaming sites?',
    answer:
      'Yes. The AniVault Chrome Extension can detect episodes on popular streaming sites (like Crunchyroll, Zoro, Netflix and others) and send that progress into the AniVault desktop app. During testing, it is available as a developer install.',
  },
  {
    question: 'What platforms does AniVault support?',
    answer: 'Right now AniVault is built for Windows desktop. Mac and Linux support are planned.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Guest mode is local-only. Your library and watch history stay on your PC. If you connect AniList, we only talk to their official API to sync your list.',
  },
  {
    question: 'How do I get Pro?',
    answer:
      'We\'re currently testing AniVault Pro with a small group of users using Lemon Squeezy in test mode. Public Pro access is coming soon.',
  },
]

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">FAQ</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <GlowCard className="overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-gray-400 leading-relaxed">{faq.answer}</div>
                </motion.div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ

