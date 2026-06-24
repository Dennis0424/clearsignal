import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
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
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto flex items-center gap-2 bg-bg-deep/85 backdrop-blur-2xl border border-white/[0.07] rounded-full px-3.5 py-2 shadow-[0_2px_24px_rgba(0,0,0,0.5)]"
      >
        <Link to="/" className="flex items-center gap-2 cursor-pointer group">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <SignalMark size={16} className="text-accent" />
          </motion.div>
          <span className="font-semibold text-xs text-text-primary tracking-tight hidden sm:inline group-hover:text-accent transition-colors duration-200">ClearSignal</span>
        </Link>
        <div className="w-px h-3 bg-border mx-1 hidden lg:block" />
        <div className="hidden lg:block scale-[0.85] origin-left">
          <MarketStatus />
        </div>
      </motion.div>

      {/* Right pill: nav links with spring active indicator */}
      <motion.nav
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto bg-bg-deep/85 backdrop-blur-2xl border border-white/[0.07] rounded-full px-1.5 py-1.5 shadow-[0_2px_24px_rgba(0,0,0,0.5)] flex gap-0.5"
      >
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer"
              style={{ color: isActive ? 'var(--color-bg-deep)' : undefined }}
            >
              {/* Spring-animated active background */}
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-full bg-accent"
                  style={{ boxShadow: '0 1px 8px rgba(16,185,129,0.35)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-bg-deep' : 'text-text-muted hover:text-text-secondary'}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </span>
            </Link>
          )
        })}
      </motion.nav>
    </div>
  )
}
