import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Input } from '@anivault/ui'
import { useState, useEffect } from 'react'

interface SearchBarProps {
  onSearch?: (query: string) => void
  value?: string
  onValueChange?: (value: string) => void
}

const SearchBar = ({ onSearch, value: controlledValue, onValueChange }: SearchBarProps) => {
  const [internalValue, setInternalValue] = useState('')
  const searchQuery = controlledValue !== undefined ? controlledValue : internalValue

  const setSearchQuery = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    } else {
      onValueChange?.(newValue)
    }
  }

  // Debounce search and call onSearch
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(searchQuery)
      }
    }, 300) // Debounce by 300ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery, onSearch])

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="relative"
    >
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <Input
          type="text"
          placeholder="Search anime..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim() && onSearch) {
              onSearch(searchQuery.trim())
            }
          }}
          className="pl-10 pr-4 py-2 w-full max-w-md backdrop-blur-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50 focus:ring-violet-500/20"
        />
      </div>
    </motion.div>
  )
}

export default SearchBar

