import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Calendar, Film, ChevronDown } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import type { Anime } from '@anivault/shared'
import { useStore } from '../store/useStore'

interface AnimeDetailsModalProps {
  anime: Anime | null
  isOpen: boolean
  onClose: () => void
  onStatusChange?: (message: string) => void
}

type StatusOption = 'plan-to-watch' | 'watching' | 'completed' | 'dropped'

const statusOptions: { value: StatusOption; label: string }[] = [
  { value: 'plan-to-watch', label: 'Planning' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
]

const AnimeDetailsModal = ({ anime, isOpen, onClose, onStatusChange }: AnimeDetailsModalProps) => {
  const { library, updateEntry, addToLibrary } = useStore()
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [progressInput, setProgressInput] = useState('')
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Get current status and progress from library
  const libraryEntry = anime ? library.find((a) => a.id === anime.id) : null
  const currentStatus = (libraryEntry?.status || 'plan-to-watch') as StatusOption
  const currentProgress = libraryEntry?.progress || 0

  // Initialize progress input
  useEffect(() => {
    if (anime && isOpen) {
      setProgressInput(currentProgress.toString())
    }
  }, [anime, isOpen, currentProgress])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!anime) return null

  const handleStatusChange = async (status: StatusOption) => {
    try {
      if (libraryEntry) {
        await updateEntry(anime.id, { status })
      } else {
        await addToLibrary(anime, status)
      }

      const statusLabel = statusOptions.find((opt) => opt.value === status)?.label || status
      onStatusChange?.(`${status === 'watching' ? 'Added to' : 'Moved to'} ${statusLabel}`)
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleProgressChange = async () => {
    const episode = parseInt(progressInput)
    if (isNaN(episode) || episode < 0) {
      setProgressInput(currentProgress.toString())
      return
    }

    const maxEpisodes = anime.episodes || 999
    const clampedEpisode = Math.min(episode, maxEpisodes)

    try {
      if (libraryEntry) {
        await updateEntry(anime.id, { progress: clampedEpisode })
        onStatusChange?.(`Progress updated to Episode ${clampedEpisode}`)
      } else {
        // If not in library, add it first
        await addToLibrary(anime, 'watching')
        await updateEntry(anime.id, { progress: clampedEpisode })
        onStatusChange?.(`Added to Library - Episode ${clampedEpisode}`)
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
      setProgressInput(currentProgress.toString())
    }
  }

  const handleProgressBlur = () => {
    handleProgressChange()
  }

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleProgressChange()
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
              {/* Hero Header - Banner (Top 40%) */}
              {anime.bannerImage && (
                <div className="relative h-[40vh] overflow-hidden">
                  <img
                    src={anime.bannerImage}
                    alt={anime.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  {/* Gradient overlay at bottom for seamless blend */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 flex items-center justify-center transition-colors border border-white/10"
              >
                <X size={20} className="text-white" />
              </button>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="px-8 pb-8">
                  {/* Floating Poster - sits naturally below banner */}
                  <div className="flex gap-8 relative z-10">
                    {/* Poster */}
                    <div className="flex-shrink-0 pt-16">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-48 md:w-64 lg:w-80 relative z-10"
                      >
                        <img
                          src={anime.coverImage || 'https://via.placeholder.com/300x450'}
                          alt={anime.title}
                          className="w-full rounded-lg shadow-2xl"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/300x450/1a1a1a/8b5cf6?text=No+Image'
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-6 pt-16">
                      {/* Title and Metadata */}
                      <div>
                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent"
                        >
                          {anime.titleEnglish || anime.title}
                        </motion.h1>

                        {anime.titleJapanese && (
                          <p className="text-xl text-gray-400 mb-4">{anime.titleJapanese}</p>
                        )}

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                          {anime.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="text-violet-400" size={18} />
                              <span className="font-semibold">{(anime.rating * 10).toFixed(0)}</span>
                              <span className="text-gray-500">/ 100</span>
                            </div>
                          )}
                          {anime.year && (
                            <div className="flex items-center gap-1">
                              <Calendar className="text-gray-400" size={16} />
                              <span>{anime.year}</span>
                            </div>
                          )}
                          {anime.format && (
                            <div className="flex items-center gap-1">
                              <Film className="text-gray-400" size={16} />
                              <span>{anime.format}</span>
                            </div>
                          )}
                          {anime.episodes && (
                            <span className="text-gray-400">{anime.episodes} episodes</span>
                          )}
                        </div>

                        {/* Genres */}
                        {anime.genres && anime.genres.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {anime.genres.slice(0, 5).map((genre) => (
                              <span
                                key={genre}
                                className="px-3 py-1 rounded-full text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                      >
                        {/* Status Dropdown - High Contrast */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-300">Status</label>
                          <div className="relative" ref={statusDropdownRef}>
                            <button
                              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                              className="w-full px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-left flex items-center justify-between transition-colors shadow-lg"
                            >
                              <span>
                                {statusOptions.find((opt) => opt.value === currentStatus)?.label ||
                                  'Planning'}
                              </span>
                              <ChevronDown
                                size={20}
                                className={`text-white transition-transform ${
                                  showStatusDropdown ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {showStatusDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full mt-2 w-full rounded-lg bg-black/95 backdrop-blur-xl border border-white/10 shadow-lg z-50"
                              >
                                {statusOptions.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(option.value)}
                                    className={`w-full text-left px-6 py-3 text-sm transition-colors ${
                                      currentStatus === option.value
                                        ? 'bg-violet-500/30 text-violet-400 font-semibold'
                                        : 'text-gray-300 hover:bg-white/10'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </div>

                        {/* Progress Input */}
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-300">
                            Edit Progress
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max={anime.episodes || 999}
                              value={progressInput}
                              onChange={(e) => setProgressInput(e.target.value)}
                              onBlur={handleProgressBlur}
                              onKeyDown={handleProgressKeyDown}
                              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                              placeholder="0"
                            />
                            <span className="text-gray-400">
                              of {anime.episodes || '?'} episodes
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Description */}
                      {anime.description && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="space-y-2"
                        >
                          <h3 className="text-xl font-semibold">Description</h3>
                          <div className="max-h-64 overflow-y-auto scrollbar-hide pr-2">
                            <p className="text-gray-300 leading-relaxed">
                              {anime.description.replace(/<[^>]*>/g, '')}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AnimeDetailsModal
