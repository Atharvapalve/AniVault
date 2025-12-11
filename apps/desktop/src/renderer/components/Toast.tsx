import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  type?: 'success' | 'info' | 'error'
}

const Toast = ({ message, isVisible, onClose, type = 'success' }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  const bgColor =
    type === 'error'
      ? 'bg-red-600/90 border-red-400/20 shadow-red-500/50'
      : type === 'info'
      ? 'bg-blue-600/90 border-blue-400/20 shadow-blue-500/50'
      : 'bg-violet-600/90 border-violet-400/20 shadow-violet-500/50'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={`fixed bottom-6 right-6 z-[100] ${bgColor} backdrop-blur-xl text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border`}
        >
          <Check size={20} />
          <span className="font-medium">{message}</span>
          <button
            onClick={onClose}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast

