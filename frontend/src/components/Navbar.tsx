import { Link, useLocation } from 'react-router-dom'
import { Microscope, Wallet, BookOpen } from 'lucide-react'
import MarketStatus from './MarketStatus'
import SignalMark from './SignalMark'

const links = [
  { to: '/research', label: 'Research', icon: Microscope },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/decisions', label: 'Decisions', icon: BookOpen },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <div className="sticky top-0 z-50 flex justify-between items-center px-4 pt-3 pb-2 pointer-events-none">
      {/* Left pill: logo + market status */}
      <div className="pointer-events-auto flex items-center gap-2 bg-bg-deep/85 backdrop-blur-2xl border border-white/[0.07] rounded-full px-3.5 py-2 shadow-[0_2px_24px_rgba(0,0,0,0.5)]">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <SignalMark size={16} className="text-accent" />
          <span className="font-semibold text-xs text-text-primary tracking-tight hidden sm:inline">ClearSignal</span>
        </Link>
        <div className="w-px h-3 bg-border mx-1 hidden lg:block" />
        <div className="hidden lg:block scale-[0.85] origin-left">
          <MarketStatus />
        </div>
      </div>

      {/* Right pill: nav links */}
      <nav className="pointer-events-auto bg-bg-deep/85 backdrop-blur-2xl border border-white/[0.07] rounded-full px-1.5 py-1.5 shadow-[0_2px_24px_rgba(0,0,0,0.5)] flex gap-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
              pathname.startsWith(to)
                ? 'bg-accent text-bg-deep shadow-[0_1px_8px_rgba(16,185,129,0.35)]'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.05]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
