import { Link, useLocation } from 'react-router-dom'
import { Activity, History, Rewind, Swords, Microscope } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: Activity },
  { to: '/deep-dive', label: 'Deep Dive', icon: Microscope },
  { to: '/compare', label: 'Head-to-Head', icon: Swords },
  { to: '/log', label: 'Trade Log', icon: History },
  { to: '/replay', label: 'Replay', icon: Rewind },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-deep/80 backdrop-blur-xl px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
            <Activity className="w-4 h-4 text-bg-deep" />
          </div>
          <span className="font-bold text-lg text-text-primary tracking-tight">
            Clear<span className="text-gold">Signal</span>
          </span>
        </Link>
        <div className="flex gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                pathname === to
                  ? 'bg-purple/15 text-purple-light border border-purple/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
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
