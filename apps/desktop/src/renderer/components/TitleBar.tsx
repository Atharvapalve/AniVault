import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  // Check initial window state and listen for changes
  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await window.electron?.isMaximized()
        setIsMaximized(maximized ?? false)
      } catch (err) {
        // Silently fail
      }
    }
    checkMaximized()

    // Listen for window state changes
    const handleMaximize = () => {
      setIsMaximized(true)
    }
    
    const handleUnmaximize = () => {
      setIsMaximized(false)
    }

    if (window.electron) {
      window.electron.onMaximize(handleMaximize)
      window.electron.onUnmaximize(handleUnmaximize)
    }

    // Also periodically check state to ensure it stays in sync (fallback)
    // This ensures the icon updates even if events don't fire
    const syncInterval = setInterval(async () => {
      try {
        const maximized = await window.electron?.isMaximized()
        setIsMaximized(prev => {
          if (prev !== maximized) {
            return maximized ?? false
          }
          return prev
        })
      } catch (err) {
        // Silently fail
      }
    }, 200) // Check every 200ms for faster response

    // Cleanup
    return () => {
      clearInterval(syncInterval)
    }
  }, [])

  // Handlers calling the window.electron bridge
  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optional: tiny visual feedback before minimize
    const root = document.getElementById('root')
    if (root) {
      root.style.transition = 'transform 120ms ease, opacity 120ms ease'
      root.style.transform = 'scale(0.98)'
      root.style.opacity = '0.8'
    }

    setTimeout(() => {
      if (window.electron) {
        window.electron
          .minimize()
          .catch(err => console.error('Minimize error:', err))
      }

      // Reset for when the window is restored
      if (root) {
        root.style.transform = ''
        root.style.opacity = ''
      }
    }, 110)
  }
  
  const handleMaximize = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.electron) {
      await window.electron.maximize().catch(() => {})
      // Immediately check state after maximize/unmaximize
      setTimeout(async () => {
        const maximized = await window.electron?.isMaximized()
        setIsMaximized(maximized ?? false)
      }, 100)
    }
  }
  
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.electron) {
      window.electron.close().catch(err => console.error('Close error:', err))
    }
  }

  return (
    // 'drag-region' makes the whole bar draggable
    <div className="flex items-center justify-end h-8 bg-transparent drag-region relative z-50">
      {/* 'no-drag' is CRITICAL: Buttons won't click if they are draggable */}
      <div className="flex no-drag relative z-[60]">
        {/* Minimize */}
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          onClick={handleMinimize}
          className="w-12 h-8 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          type="button"
        >
          <Minus size={14} />
        </motion.button>

        {/* Maximize / Restore */}
        <motion.button
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          onClick={handleMaximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          title={isMaximized ? 'Restore Down' : 'Maximize'}
          type="button"
        >
          {isMaximized ? (
            <Maximize2 size={12} className="text-white" />
          ) : (
            <Square size={12} className="text-white" />
          )}
        </motion.button>

        {/* Close (Red hover effect) */}
        <motion.button
          whileHover={{ backgroundColor: '#ef4444' }}
          onClick={handleClose}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
          type="button"
        >
          <X size={14} />
        </motion.button>
      </div>
    </div>
  )
}

export default TitleBar

