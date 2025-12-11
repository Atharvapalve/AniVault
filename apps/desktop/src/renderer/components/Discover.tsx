import { motion } from 'framer-motion'
import { Search, Loader2, X, Plus, ChevronDown, Star } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { Anime } from '@anivault/shared'
import { anilistService } from '../services/anilist.service'
import { useStore } from '../store/useStore'
import {
  AVAILABLE_MOODS,
  type MoodId,
  type MoodRecommendation,
  getMoodRecommendations,
} from '../services/recommendation.service'
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

const genres = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
]

const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015']

type SortOption = 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'POPULARITY_DESC', label: 'Popularity' },
  { value: 'SCORE_DESC', label: 'Score' },
  { value: 'START_DATE_DESC', label: 'Newest' },
]

interface DiscoverProps {
  initialQuery?: string
}

const Discover = ({ initialQuery = '' }: DiscoverProps) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('POPULARITY_DESC')
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<Anime[]>([])
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([])
  const [topRatedAnime, setTopRatedAnime] = useState<Anime[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)
  const [isLoadingTopRated, setIsLoadingTopRated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMoodId, setSelectedMoodId] = useState<MoodId>('hype')
  const [moodRec, setMoodRec] = useState<MoodRecommendation | null>(null)
  const [isLoadingMood, setIsLoadingMood] = useState(false)
  const [moodError, setMoodError] = useState<string | null>(null)
  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const genreDropdownRef = useRef<HTMLDivElement>(null)
  const yearDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const { addToLibrary, accessToken, isPro, library } = useStore()

  // Update search query when initialQuery prop changes
  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery)
    }
  }, [initialQuery])

  // Auto-focus search input on mount
  useEffect(() => {
    if (searchInputRef.current && !initialQuery) {
      searchInputRef.current.focus()
    }
  }, [initialQuery])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(target)) {
        setShowGenreDropdown(false)
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(target)) {
        setShowYearDropdown(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load trending and top rated on mount if no search
  useEffect(() => {
    if (!searchQuery.trim() && !selectedGenre && !selectedYear) {
      loadTrending()
      loadTopRated()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // RESET search when filters change (New Search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || selectedGenre || selectedYear) {
        // Reset to page 1 and clear results for a new search
        setPage(1)
        performSearch(1, true) // true = reset list
      } else {
        // Clear search results when search is empty
        setSearchResults([])
        setPage(1)
        setHasMore(true)
        // Reload trending and top rated
        if (!initialQuery) {
          loadTrending()
          loadTopRated()
        }
      }
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedGenre, selectedYear, sortBy])

  // Mood recommendations (Pro only)
  useEffect(() => {
    if (!isPro) return

    let cancelled = false
    const run = async () => {
      try {
        setIsLoadingMood(true)
        setMoodError(null)
        const rec = await getMoodRecommendations(selectedMoodId, library || [], {
          limit: 12,
          excludeCompleted: true,
          excludeDropped: true,
        })
        if (!cancelled) {
          setMoodRec(rec)
        }
      } catch (err) {
        console.error('Failed to load mood recommendations', err)
        if (!cancelled) {
          setMoodError('Failed to load mood recommendations')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMood(false)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [selectedMoodId, library, isPro])

  const loadTrending = async () => {
    try {
      setIsLoadingTrending(true)
      if (accessToken) {
        anilistService.setAccessToken(accessToken)
      }
      const data = await anilistService.getTrendingAnime(20)
      setTrendingAnime(data)
    } catch (err) {
      console.error('Failed to load trending:', err)
    } finally {
      setIsLoadingTrending(false)
    }
  }

  const loadTopRated = async () => {
    try {
      setIsLoadingTopRated(true)
      if (accessToken) {
        anilistService.setAccessToken(accessToken)
      }
      const data = await anilistService.getTopRatedAnime(10)
      setTopRatedAnime(data)
    } catch (err) {
      console.error('Failed to load top rated:', err)
    } finally {
      setIsLoadingTopRated(false)
    }
  }

  const performSearch = async (pageNum: number, reset: boolean = false) => {
    try {
      // Don't show full loading spinner for "load more", only for new search
      if (reset) setIsLoading(true) 
      
      setError(null)

      if (accessToken) {
        anilistService.setAccessToken(accessToken)
      }

      // Call our upgraded API function
      const data = await anilistService.searchAnime(
        searchQuery.trim(),
        {
          genre: selectedGenre,
          year: selectedYear,
          sort: sortBy
        },
        pageNum,
        20 // items per page
      )

      // If we got fewer than 20 items, we've reached the end
      setHasMore(data.length === 20)

      if (reset) {
        setSearchResults(data) // Replace list
      } else {
        setSearchResults(prev => [...prev, ...data]) // Append to list
      }

    } catch (err) {
      console.error('Search failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to search anime')
      if (reset) {
        setSearchResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // "Load More" Handler
  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      performSearch(nextPage, false) // false = append to list
    }
  }

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

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedGenre(null)
    setSelectedYear(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const hasSearchQuery = searchQuery.trim() || selectedGenre || selectedYear

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-2xl mx-auto"
      >
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={24}
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for anime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 text-lg rounded-lg backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Mood Recommendations (Pro) */}
      {isPro && (
        <section className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Mood Recommendations
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  Pro
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Pick a mood and we&apos;ll find the perfect anime for your vibe.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {AVAILABLE_MOODS.map((mood) => {
              const isActive = mood.id === selectedMoodId
              return (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMoodId(mood.id)}
                  className={[
                    'flex items-center gap-2 rounded-full px-3 py-1 text-sm transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow shadow-primary/40'
                      : 'bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/60',
                  ].join(' ')}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              )
            })}
          </div>

          <div className="relative mt-2">
            {isLoadingMood && (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Loading mood-based picks...
              </div>
            )}

            {moodError && !isLoadingMood && (
              <div className="flex h-32 items-center justify-center text-sm text-red-400">
                {moodError}
              </div>
            )}

            {!isLoadingMood && !moodError && moodRec && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{moodRec.mood.description}</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                  {moodRec.anime.map((anime, index) => (
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

            {!isLoadingMood && !moodError && !moodRec && (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No recommendations found for this mood yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Filters Row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap items-center gap-4 justify-center"
      >
        {/* Genre Dropdown */}
        <div className="relative" ref={genreDropdownRef}>
          <button
            onClick={() => {
              setShowGenreDropdown(!showGenreDropdown)
              setShowYearDropdown(false)
              setShowSortDropdown(false)
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <span className="text-sm font-medium">
              {selectedGenre ? `Genre: ${selectedGenre}` : 'All Genres'}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showGenreDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 w-48 rounded-lg bg-black/90 backdrop-blur-xl border border-white/10 shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              <button
                onClick={() => {
                  setSelectedGenre(null)
                  setShowGenreDropdown(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  !selectedGenre
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                All Genres
              </button>
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setSelectedGenre(genre)
                    setShowGenreDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedGenre === genre
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Year Dropdown */}
        <div className="relative" ref={yearDropdownRef}>
          <button
            onClick={() => {
              setShowYearDropdown(!showYearDropdown)
              setShowGenreDropdown(false)
              setShowSortDropdown(false)
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <span className="text-sm font-medium">
              {selectedYear ? `Year: ${selectedYear}` : 'All Years'}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showYearDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showYearDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 w-48 rounded-lg bg-black/90 backdrop-blur-xl border border-white/10 shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              <button
                onClick={() => {
                  setSelectedYear(null)
                  setShowYearDropdown(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  !selectedYear
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                All Years
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year)
                    setShowYearDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedYear === year
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {year}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => {
              setShowSortDropdown(!showSortDropdown)
              setShowGenreDropdown(false)
              setShowYearDropdown(false)
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <span className="text-sm font-medium">
              Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showSortDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 w-48 rounded-lg bg-black/90 backdrop-blur-xl border border-white/10 shadow-lg z-50"
            >
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value)
                    setShowSortDropdown(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    sortBy === option.value
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Search Results */}
      {hasSearchQuery && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Search Results
          </h2>

          {/* Show full-page loader only on initial load (when no results yet) */}
          {isLoading && searchResults.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Show results even when loading more (grid stays visible) */}
          {!error && searchResults.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              >
                {searchResults.map((anime, index) => (
                  <AnimeCard
                    key={`${anime.id}-${index}`}
                    anime={anime}
                    index={index}
                    onAdd={handleAddToLibrary}
                    onClick={handleCardClick}
                  />
                ))}
              </motion.div>

              {/* LOAD MORE BUTTON */}
              {hasMore && (
                <div className="flex justify-center pt-8 pb-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Loading...
                      </>
                    ) : (
                      'Load More Anime'
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {!isLoading && !error && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search size={48} className="mb-4 opacity-50" />
              <p className="text-lg">No results found</p>
              <p className="text-sm mt-2">Try a different search term or filter</p>
            </div>
          )}
        </div>
      )}

      {/* Trending Now + Top Rated (when no search) - Grid Layout */}
      {!hasSearchQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Main Column - Trending Now (70%) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Trending Now
            </h2>

            {isLoadingTrending && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
            )}

            {!isLoadingTrending && trendingAnime.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {trendingAnime.map((anime, index) => (
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

          {/* Right Sidebar - Top Rated (30%) */}
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
    </div>
  )
}

export default Discover
