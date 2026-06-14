import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'

export default function LandingNav() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
            <Activity className="w-4 h-4 text-bg-deep" />
          </div>
          <span className="font-bold text-lg text-text-primary tracking-tight">
            Clear<span className="text-gold">Signal</span>
          </span>
        </Link>
        <Link
          to="/research"
          className="px-5 py-2.5 border border-border-light rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all duration-200"
        >
          Launch App &rarr;
        </Link>
      </div>
    </nav>
  )
}
