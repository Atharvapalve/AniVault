import { motion } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Anime } from '@anivault/shared'
import { anilistService } from '../services/anilist.service'
import { useStore } from '../store/useStore'
import Toast from './Toast'
import AnimeDetailsModal from './AnimeDetailsModal'

interface AnimeCardProps {
  anime: Anime
  index: number
  onAdd: (anime: Anime) => void
  onClick: (anime: Anime) => void
}

const AnimeCard = ({ anime, index, onAdd, onClick }: AnimeCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-48 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={() => onClick(anime)}
        className="relative h-[28rem] rounded-lg overflow-hidden cursor-pointer transition-all duration-300"
        style={{
          boxShadow: isHovered
            ? '0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3)'
            : '0 4px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Poster Image */}
        <div className="absolute inset-0">
          <img
            src={anime.coverImage || 'https://via.placeholder.com/300x450'}
            alt={anime.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/8b5cf6?text=No+Image'
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
            {anime.titleEnglish || anime.title}
          </h3>
          {anime.rating && (
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <span className="text-violet-400">★</span>
              <span>{anime.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Quick Add Button - appears on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 10,
          }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 right-4 z-20"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onAdd(anime)
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/90 backdrop-blur-sm hover:bg-violet-500 text-white shadow-lg shadow-violet-500/50 transition-all"
          >
            <Plus size={20} />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

const TrendingNow = () => {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { accessToken, addToLibrary } = useStore()

  const handleAddToLibrary = async (anime: Anime) => {
    try {
      await addToLibrary(anime, 'plan-to-watch')
      setToastMessage('Added to Library')
      setToastVisible(true)
    } catch (error) {
      console.error('Failed to add to library:', error)
    }
  }

  const handleCardClick = (anime: Anime) => {
    setSelectedAnime(anime)
    setIsModalOpen(true)
  }

  const handleStatusChange = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Set access token if available
        if (accessToken) {
          anilistService.setAccessToken(accessToken)
        }
        
        const data = await anilistService.getTrendingAnime(10)
        setTrendingAnime(data)
      } catch (err) {
        console.error('Failed to fetch trending anime:', err)
        setError(err instanceof Error ? err.message : 'Failed to load trending anime')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrending()
  }, [accessToken])

  return (
    <div className="relative mb-12">
      {/* Dark gradient background fading from black to transparent at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-transparent -z-10" />
      
      <div className="relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Trending Now
          </h2>
          <p className="text-sm text-gray-400">Discover what's hot in the anime world</p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Horizontal Scroll Carousel */}
        {!isLoading && !error && trendingAnime.length > 0 && (
          <div className="overflow-x-auto overflow-y-visible pb-4 -mx-6 px-6 scrollbar-hide">
            <div className="flex gap-4">
              {trendingAnime.map((anime, index) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  index={index}
                  onAdd={handleAddToLibrary}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          </div>
        )}

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

        {/* Empty State */}
        {!isLoading && !error && trendingAnime.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 text-sm">No trending anime found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrendingNow

