import { useEffect } from 'react'
import Layout from './components/Layout'
import { useStore } from './store/useStore'

function App() {
  const theme = useStore((state) => state.theme)

  useEffect(() => {
    const body = document.body
    if (!body) return

    const existingThemeClasses = Array.from(body.classList).filter((cls) => cls.startsWith('theme-'))
    existingThemeClasses.forEach((cls) => body.classList.remove(cls))

    if (theme && theme !== 'default') {
      body.classList.add(theme)
    }
  }, [theme])

  return <Layout />
}

export default App

