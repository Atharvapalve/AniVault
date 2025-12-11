import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import type { Anime } from '@anivault/shared'
import { anilistService } from '../services/anilist.service'

interface AnimeMatchModalProps {
  isOpen: boolean
  onClose: () => void
  detectedTitle: string
  detectedEpisode: number
  onMatch: (anime: Anime, episode: number) => void
}

export default function AnimeMatchModal({
  isOpen,
  onClose,
  detectedTitle,
  detectedEpisode,
  onMatch,
}: AnimeMatchModalProps) {
  const [searchQuery, setSearchQuery] = useState(detectedTitle)
  const [searchResults, setSearchResults] = useState<Anime[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)

  // Auto-search when modal opens
  useEffect(() => {
    if (isOpen && detectedTitle) {
      handleSearch()
    }
  }, [isOpen])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await anilistService.searchAnime(searchQuery, {}, 1, 10)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (anime: Anime) => {
    setSelectedAnime(anime)
    onMatch(anime, detectedEpisode)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Unknown Anime Detected</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    We found "{detectedTitle} - Episode {detectedEpisode}". Match it to an anime:
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search for anime..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                {isSearching ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Searching...</div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-gray-400 mb-2">No results found</p>
                      <p className="text-sm text-gray-500">Try a different search term</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((anime) => (
                      <motion.button
                        key={anime.id}
                        onClick={() => handleSelect(anime)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex gap-4">
                          <img
                            src={anime.coverImage || 'https://via.placeholder.com/100x140'}
                            alt={anime.title}
                            className="w-20 h-28 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white mb-1 truncate">
                              {anime.title}
                            </h3>
                            {anime.titleEnglish && anime.titleEnglish !== anime.title && (
                              <p className="text-sm text-gray-400 mb-2 truncate">
                                {anime.titleEnglish}
                              </p>
                            )}
                            {anime.episodes && (
                              <p className="text-xs text-gray-500">
                                {anime.episodes} episodes
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
