import { motion } from 'framer-motion'
import { Home, Search, Library, Settings, TrendingUp, BarChart2 } from 'lucide-react'

// Define the shape of our props so TypeScript is happy
interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { icon: Home, label: 'Home', id: 'home' },
  { icon: Library, label: 'Library', id: 'library' },
  { icon: Search, label: 'Discover', id: 'discover' },
  { icon: BarChart2, label: 'Stats', id: 'stats' },
  { icon: Settings, label: 'Settings', id: 'settings' },
]

const Sidebar = ({ activePage, onNavigate }: SidebarProps) => {
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 h-full backdrop-blur-xl bg-card/40 border-r border-border/60"
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AniVault
        </h1>
      </div>
      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)} // <--- This now talks to Layout!
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary/20 text-primary shadow-lg shadow-primary/20 border border-primary/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          )
        })}
      </nav>
    </motion.aside>
  )
}

export default Sidebar
