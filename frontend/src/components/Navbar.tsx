import { Link, useLocation } from 'react-router-dom'
import { Microscope, Wallet, BookOpen } from 'lucide-react'
import MarketStatus from './MarketStatus'

const links = [
  { to: '/research', label: 'Research', icon: Microscope },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/decisions', label: 'Decisions', icon: BookOpen },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg-deep/95 backdrop-blur-sm px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <span className="font-semibold text-sm text-text-primary tracking-tight">
              ClearSignal
            </span>
          </Link>
          <div className="hidden lg:block">
            <MarketStatus />
          </div>
        </div>
        <div className="flex gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                pathname === to
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
