import { Link, useLocation } from 'react-router-dom'
import { Activity, History, Rewind, Swords } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: Activity },
  { to: '/compare', label: 'Head-to-Head', icon: Swords },
  { to: '/log', label: 'Trade Log', icon: History },
  { to: '/replay', label: 'Replay', icon: Rewind },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="border-b border-border bg-surface px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary-light font-semibold text-lg">
          <Activity className="w-5 h-5" />
          ClearSignal
        </Link>
        <div className="flex gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                pathname === to
                  ? 'bg-primary/20 text-primary-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
