import { useState } from 'react'
import { Lock } from 'lucide-react'
import Toast from '../Toast'
import { useStore } from '../../store/useStore'

const THEMES = [
  { id: 'default', name: 'Default', isPremium: false, previewColor: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' },
  { id: 'theme-neon', name: 'Neon', isPremium: true, previewColor: 'linear-gradient(135deg, #ff4d9d, #22d3ee)' },
  { id: 'theme-ocean', name: 'Ocean', isPremium: true, previewColor: 'linear-gradient(135deg, #0ea5e9, #14b8a6)' },
  { id: 'theme-midnight', name: 'Midnight', isPremium: true, previewColor: 'linear-gradient(135deg, #111827, #8b5cf6)' },
]

const ThemeSelector = () => {
  const { isPro, theme, setTheme } = useStore((state) => ({
    isPro: state.isPro,
    theme: state.theme,
    setTheme: state.setTheme,
  }))

  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('info')

  const handleSelect = (themeId: string, isPremium: boolean) => {
    if (isPremium && !isPro) {
      setToastMessage('Upgrade to Pro to unlock this theme')
      setToastType('info')
      setToastVisible(true)
      return
    }

    setTheme(themeId)
    setToastMessage('Theme applied')
    setToastType('success')
    setToastVisible(true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold">Themes</h4>
          <p className="text-sm text-white/60">Pick a look for AniVault</p>
        </div>
        {!isPro && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
            Pro Unlocks
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEMES.map((item) => {
          const isActive = theme === item.id || (!theme && item.id === 'default')
          const isLocked = item.isPremium && !isPro
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id, item.isPremium)}
              className={`relative text-left rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-primary/60 hover:bg-white/10 ${
                isActive ? 'ring-2 ring-primary border-primary/50' : ''
              } ${isLocked ? 'opacity-80' : ''}`}
            >
              {isLocked && (
                <div className="absolute top-3 right-3 text-white/70">
                  <Lock size={16} />
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/60">
                    {item.isPremium ? 'Premium theme' : 'Free theme'}
                  </p>
                </div>
                <span
                  className="h-10 w-16 rounded-md border border-white/20 shadow-inner"
                  style={{ background: item.previewColor }}
                />
              </div>

              {isActive && (
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/30">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Selected
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
      />
    </div>
  )
}

export default ThemeSelector



















