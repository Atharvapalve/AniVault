import { motion } from 'framer-motion'
import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Anime } from '@anivault/shared'
import AnimeDetailsModal from './AnimeDetailsModal'
import Toast from './Toast'

const Library = () => {
  const library = useStore((state) => state.library)
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleCardClick = (anime: Anime) => {
    setSelectedAnime(anime)
    setIsModalOpen(true)
  }

  const handleStatusChange = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  if (library.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <h2 className="text-2xl font-bold mb-2">Your Library</h2>
        <p>You haven't added any anime yet.</p>
      </div>
    )
  }

  // Group by status
  const grouped = library.reduce((acc, anime) => {
    const status = anime.status
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(anime)
    return acc
  }, {} as Record<string, Anime[]>)

  const statusLabels: Record<string, string> = {
    'watching': 'Watching',
    'plan-to-watch': 'Planning',
    'completed': 'Completed',
    'on-hold': 'On Hold',
    'dropped': 'Dropped',
  }

  const statusOrder = ['watching', 'plan-to-watch', 'completed', 'on-hold', 'dropped']

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-6">Your Library</h2>
      
      {statusOrder.map((status) => {
        const animes = grouped[status] || []
        if (animes.length === 0) return null

        return (
          <div key={status} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-300">{statusLabels[status]}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {animes.map((anime) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleCardClick(anime)}
                  className="relative group cursor-pointer"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-black/20">
                    <img
                      src={anime.coverImage || 'https://via.placeholder.com/300x450'}
                      alt={anime.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/8b5cf6?text=No+Image'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <h4 className="text-white font-semibold text-sm line-clamp-2">
                        {anime.titleEnglish || anime.title}
                      </h4>
                      {anime.progress > 0 && (
                        <div className="mt-2">
                          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500"
                              style={{ width: `${(anime.progress / (anime.episodes || 1)) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-300 mt-1">
                            {anime.progress} / {anime.episodes || '?'} episodes
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Anime Details Modal */}
      <AnimeDetailsModal
        anime={selectedAnime}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAnime(null)
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  )
}

export default Library

