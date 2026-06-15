import { Link } from 'react-router-dom'
import SignalMark from './SignalMark'

export default function LandingNav() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 px-6 md:px-12 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-text-primary tracking-tight">
          <SignalMark size={20} className="text-accent" animate={true} />
          ClearSignal
        </Link>
        <Link
          to="/research"
          className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
        >
          Open App
        </Link>
      </div>
    </nav>
  )
}
