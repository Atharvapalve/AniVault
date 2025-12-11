import { motion } from 'framer-motion'
import { Loader2, Star } from 'lucide-react'
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={() => onClick(anime)}
        className="relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 cursor-pointer"
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
      </motion.div>
    </motion.div>
  )
}

interface TopRatedItemProps {
  anime: Anime
  rank: number
  onClick: (anime: Anime) => void
}

const TopRatedItem = ({ anime, rank, onClick }: TopRatedItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      onClick={() => onClick(anime)}
      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
    >
      {/* Rank Badge */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm">
        {rank}
      </div>

      {/* Cover Image */}
      <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden">
        <img
          src={anime.coverImage || 'https://via.placeholder.com/300x450'}
          alt={anime.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/8b5cf6?text=No+Image'
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-violet-400 transition-colors">
          {anime.titleEnglish || anime.title}
        </h4>
        {anime.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="text-violet-400" />
            <span className="text-xs text-gray-400">{(anime.rating * 10).toFixed(0)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const HomeDashboard = () => {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([])
  const [topRatedAnime, setTopRatedAnime] = useState<Anime[]>([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(true)
  const [isLoadingTopRated, setIsLoadingTopRated] = useState(true)
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
    const fetchData = async () => {
      try {
        setIsLoadingTrending(true)
        setIsLoadingTopRated(true)
        setError(null)

        // Set token if available (public endpoints work without token)
        if (accessToken) {
          anilistService.setAccessToken(accessToken)
        } else {
          // Clear token for guest mode
          anilistService.setAccessToken(null)
        }

        // Fetch trending (20 items) - works without authentication
        const trendingData = await anilistService.getTrendingAnime(20)
        setTrendingAnime(trendingData)

        // Fetch top rated (10 items) - works without authentication
        const topRatedData = await anilistService.getTopRatedAnime(10)
        setTopRatedAnime(topRatedData)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load anime')
      } finally {
        setIsLoadingTrending(false)
        setIsLoadingTopRated(false)
      }
    }

    fetchData()
  }, [accessToken])

  return (
    <div className="space-y-8">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Column - Trending Now (70%) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Trending Now
          </h2>

          {isLoadingTrending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          )}

          {error && !isLoadingTrending && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!isLoadingTrending && !error && trendingAnime.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {trendingAnime.slice(0, 12).map((anime, index) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  index={index}
                  onAdd={handleAddToLibrary}
                  onClick={handleCardClick}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Right Column - Top Rated (30%) */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Top Rated
          </h2>

          {isLoadingTopRated && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          )}

          {!isLoadingTopRated && topRatedAnime.length > 0 && (
            <div className="space-y-2">
              {topRatedAnime.map((anime, index) => (
                <TopRatedItem
                  key={anime.id}
                  anime={anime}
                  rank={index + 1}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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

export default HomeDashboard

