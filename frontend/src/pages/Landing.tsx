import { Link } from 'react-router-dom'
import { Brain, ShieldCheck, Zap, Search, Shield, ArrowRightLeft } from 'lucide-react'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Landing() {
  const revealRef = useScrollReveal()

  return (
    <div ref={revealRef} className="min-h-screen bg-bg-deep">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-6 overflow-hidden">
        <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_70%)] animate-float" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.12)_0%,transparent_70%)] animate-float-delay" />

        <div className="max-w-7xl mx-auto w-full relative hero-animate">
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-gold mb-6">
            Deterministic Signal Engine
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-text-primary leading-[1.1] tracking-tight mb-3">
            73% of retail<br />traders lose.
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-gold mb-5">
            You don&rsquo;t have to.
          </p>
          <p className="text-sm md:text-base text-text-secondary max-w-lg leading-relaxed mb-8">
            ClearSignal uses 5 AI agents to score trades, a FOMO guardian to check your impulses, and Bitget integration to execute &mdash; all in one flow.
          </p>
          <div className="flex gap-3">
            <Link
              to="/research"
              className="px-7 py-3.5 bg-gradient-to-r from-purple to-gold text-white rounded-xl font-semibold text-sm cta-glow transition-all duration-300"
            >
              Start Trading Smarter
            </Link>
            <a
              href="#how-it-works"
              className="px-7 py-3.5 border border-border-light rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:border-purple/40 transition-all duration-200"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-purple mb-3">What You Get</p>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Three layers of protection</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal-stagger">
            <FeatureCard
              icon={<Brain className="w-5 h-5 text-purple-light" />}
              iconBg="bg-purple/15"
              title="Multi-Agent Research"
              description="5 AI agents analyze financials, social sentiment, and news. Bull vs Bear debate with a judge verdict."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5 text-gold" />}
              iconBg="bg-gold/15"
              title="FOMO Protection"
              description="Every trade goes through a behavioral check. Regret simulation shows potential downside before you commit."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5 text-bullish" />}
              iconBg="bg-bullish/15"
              title="One-Click Execution"
              description="Connected to Bitget. Research, check yourself, then trade — all in one seamless flow. No tab switching."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-24 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-gold mb-3">How It Works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary">Three steps to a better trade</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-4 reveal-stagger">
            <Step number={1} color="from-purple to-purple-light" icon={<Search className="w-4 h-4" />} title="Research" description="Enter a ticker. AI agents analyze it from every angle." />
            <div className="hidden md:block w-12 h-[2px] bg-gradient-to-r from-purple/50 to-gold/50" />
            <Step number={2} color="from-gold to-gold-light" icon={<Shield className="w-4 h-4" />} title="Check Yourself" description="FOMO guardian scores your emotional state. Journal your reasoning." />
            <div className="hidden md:block w-12 h-[2px] bg-gradient-to-r from-gold/50 to-bullish/50" />
            <Step number={3} color="from-bullish to-emerald-400" icon={<ArrowRightLeft className="w-4 h-4" />} title="Trade" description="Execute directly on Bitget. Track outcomes. Learn from every decision." />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="px-6 py-12 border-t border-border reveal">
        <div className="max-w-7xl mx-auto flex justify-center items-center gap-3 flex-wrap">
          {['Bitget Hackathon S1 • Track 3', 'Python + FastAPI', 'React + Tailwind', 'Claude AI', 'Bitget MCP'].map((badge) => (
            <span key={badge} className="px-4 py-2 border border-border rounded-lg text-xs text-text-secondary">
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(139,92,246,0.08)_0%,transparent_60%)]" />
        <div className="max-w-7xl mx-auto text-center relative reveal">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">Ready to trade with clarity?</h2>
          <p className="text-sm text-text-secondary mb-8">No signup required. Connect your Bitget account and start.</p>
          <Link
            to="/research"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple to-gold text-white rounded-xl font-semibold text-sm cta-glow transition-all duration-300"
          >
            Launch ClearSignal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gold to-gold-light" />
            <span className="text-xs font-semibold text-text-secondary">ClearSignal</span>
          </div>
          <span className="text-xs text-text-muted">Built for Bitget Hackathon S1 • 2026</span>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, iconBg, title, description }: { icon: React.ReactNode; iconBg: string; title: string; description: string }) {
  return (
    <div className="reveal glass-card glass-card-hover p-6 transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  )
}

function Step({ number, color, icon, title, description }: { number: number; color: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="reveal flex-1 text-center">
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3 text-white font-bold text-sm`}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed max-w-[200px] mx-auto">{description}</p>
    </div>
  )
}
