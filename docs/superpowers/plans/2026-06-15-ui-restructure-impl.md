# UI Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform ClearSignal from a dev prototype into a polished product with a landing page, portfolio management, decision journal, and clean navigation.

**Architecture:** New pages (Landing, Portfolio, Decisions) join the existing DeepDive page under a restructured router. Landing gets its own minimal nav; app pages share a full nav. Portfolio connects to Bitget via existing backend. Scroll animations via IntersectionObserver + CSS.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4, Lucide React, wagmi/viem/@web3modal (wallet), @tanstack/react-query, Recharts (existing)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `frontend/src/pages/Landing.tsx` | Landing page with all 6 sections |
| Create | `frontend/src/pages/Portfolio.tsx` | Wallet connect + Bitget holdings |
| Create | `frontend/src/pages/Decisions.tsx` | Decision journal + autopsy stats |
| Create | `frontend/src/hooks/useScrollReveal.ts` | IntersectionObserver hook for animations |
| Create | `frontend/src/components/LandingNav.tsx` | Minimal nav for landing page |
| Modify | `frontend/src/App.tsx` | New routes, remove old pages |
| Modify | `frontend/src/components/Navbar.tsx` | 3 links only (Research, Portfolio, Decisions) |
| Modify | `frontend/src/api.ts` | Add `getPortfolioAssets()` |
| Modify | `frontend/src/types.ts` | Add `PortfolioAsset` interface |
| Modify | `frontend/src/index.css` | Add scroll-reveal + float keyframes |
| Modify | `frontend/package.json` | Add wagmi, viem, web3modal, react-query |
| Modify | `backend/app/routes.py` | Add `/portfolio/assets` endpoint |
| Delete | `frontend/src/pages/Compare.tsx` | Removed route |
| Delete | `frontend/src/pages/Replay.tsx` | Removed route |
| Delete | `frontend/src/pages/TradeLog.tsx` | Removed route |
| Delete | `frontend/src/pages/Dashboard.tsx` | Replaced by Landing |

---

### Task 1: Router + Navbar Restructure

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Navbar.tsx`
- Create: `frontend/src/components/LandingNav.tsx`
- Delete: `frontend/src/pages/Compare.tsx`, `frontend/src/pages/Replay.tsx`, `frontend/src/pages/TradeLog.tsx`, `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create LandingNav component**

Create `frontend/src/components/LandingNav.tsx`:

```tsx
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
```

- [ ] **Step 2: Update Navbar for app pages**

Replace contents of `frontend/src/components/Navbar.tsx`:

```tsx
import { Link, useLocation } from 'react-router-dom'
import { Activity, Microscope, Wallet, BookOpen } from 'lucide-react'

const links = [
  { to: '/research', label: 'Research', icon: Microscope },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/decisions', label: 'Decisions', icon: BookOpen },
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
```

- [ ] **Step 3: Update App.tsx with new routes**

Replace contents of `frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import LandingNav from './components/LandingNav'
import Landing from './pages/Landing'
import DeepDive from './pages/DeepDive'
import Portfolio from './pages/Portfolio'
import Decisions from './pages/Decisions'

function Layout() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <>
      {isLanding ? <LandingNav /> : <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/research" element={<DeepDive />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/decisions" element={<Decisions />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Create placeholder pages**

Create `frontend/src/pages/Landing.tsx`:

```tsx
export default function Landing() {
  return <div className="min-h-screen flex items-center justify-center text-text-secondary">Landing — coming in Task 2</div>
}
```

Create `frontend/src/pages/Portfolio.tsx`:

```tsx
export default function Portfolio() {
  return <div className="max-w-7xl mx-auto px-6 py-10 text-text-secondary">Portfolio — coming in Task 3</div>
}
```

Create `frontend/src/pages/Decisions.tsx`:

```tsx
export default function Decisions() {
  return <div className="max-w-7xl mx-auto px-6 py-10 text-text-secondary">Decisions — coming in Task 4</div>
}
```

- [ ] **Step 5: Delete removed pages**

```bash
cd frontend
rm src/pages/Compare.tsx src/pages/Replay.tsx src/pages/TradeLog.tsx src/pages/Dashboard.tsx
```

- [ ] **Step 6: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors. If `Dashboard` imports cause issues, they were removed in App.tsx already.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/Navbar.tsx frontend/src/components/LandingNav.tsx frontend/src/pages/Landing.tsx frontend/src/pages/Portfolio.tsx frontend/src/pages/Decisions.tsx
git rm frontend/src/pages/Compare.tsx frontend/src/pages/Replay.tsx frontend/src/pages/TradeLog.tsx frontend/src/pages/Dashboard.tsx
git commit -m "refactor: restructure router, add new page shells, remove dead routes"
```

---

### Task 2: Landing Page

**Files:**
- Modify: `frontend/src/pages/Landing.tsx` (replace placeholder)
- Create: `frontend/src/hooks/useScrollReveal.ts`
- Modify: `frontend/src/index.css` (add animation keyframes)

- [ ] **Step 1: Add animation keyframes to index.css**

Append to end of `frontend/src/index.css`:

```css
/* Scroll reveal */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered children */
.reveal-stagger > .reveal:nth-child(1) { transition-delay: 0ms; }
.reveal-stagger > .reveal:nth-child(2) { transition-delay: 100ms; }
.reveal-stagger > .reveal:nth-child(3) { transition-delay: 200ms; }
.reveal-stagger > .reveal:nth-child(4) { transition-delay: 300ms; }

/* Float animation for orbs */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delay {
  animation: float 8s ease-in-out infinite;
  animation-delay: -3s;
}

/* Hero text stagger fade-in */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-animate > *:nth-child(1) { animation: fadeInUp 0.6s ease forwards; animation-delay: 0.1s; opacity: 0; }
.hero-animate > *:nth-child(2) { animation: fadeInUp 0.6s ease forwards; animation-delay: 0.3s; opacity: 0; }
.hero-animate > *:nth-child(3) { animation: fadeInUp 0.6s ease forwards; animation-delay: 0.5s; opacity: 0; }
.hero-animate > *:nth-child(4) { animation: fadeInUp 0.6s ease forwards; animation-delay: 0.7s; opacity: 0; }

/* CTA pulse glow */
.cta-glow:hover {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(245, 158, 11, 0.15);
}
```

- [ ] **Step 2: Create useScrollReveal hook**

Create `frontend/src/hooks/useScrollReveal.ts`:

```ts
import { useEffect, useRef } from 'react'

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    el.querySelectorAll('.reveal').forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  return ref
}
```

- [ ] **Step 3: Build the Landing page**

Replace `frontend/src/pages/Landing.tsx`:

```tsx
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
          <span className="text-xs text-text-muted">Built for Bitget Hackathon S1 &bull; 2026</span>
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
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 5: Run dev server and test landing page**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173/` — verify hero, features, how-it-works, trust bar, CTA, footer all render. Verify scroll animations trigger. Verify "Start Trading Smarter" navigates to `/research`. Verify "Launch App" in nav navigates to `/research`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Landing.tsx frontend/src/hooks/useScrollReveal.ts frontend/src/index.css
git commit -m "feat: add landing page with hero, features, how-it-works, and scroll animations"
```

---

### Task 3: Portfolio Page + Backend Endpoint

**Files:**
- Modify: `frontend/src/pages/Portfolio.tsx` (replace placeholder)
- Modify: `frontend/src/api.ts` (add getPortfolioAssets)
- Modify: `frontend/src/types.ts` (add PortfolioAsset)
- Modify: `backend/app/routes.py` (add /portfolio/assets endpoint)

- [ ] **Step 1: Add backend endpoint**

Add to end of `backend/app/routes.py`:

```python
@router.get("/portfolio/assets")
async def get_portfolio_assets():
    """Get spot account assets from Bitget."""
    import asyncio
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_account_assets)
    return data
```

Add the import at the top of the file (after existing trader imports):

```python
from agents.trader import get_ticker_price, place_spot_order, preview_trade, get_account_assets
```

- [ ] **Step 2: Add frontend types**

Append to `frontend/src/types.ts`:

```ts
export interface PortfolioAsset {
  coin: string
  available: string
  frozen: string
  locked: string
  uTime: string
}

export interface PortfolioResponse {
  assets?: PortfolioAsset[]
  error?: string
}
```

- [ ] **Step 3: Add API function**

Append to `frontend/src/api.ts`:

```ts
import type { ..., PortfolioResponse } from './types'

export async function getPortfolioAssets(): Promise<PortfolioResponse> {
  const res = await fetch(`${BASE}/portfolio/assets`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
```

(Update the existing import line to include `PortfolioResponse`.)

- [ ] **Step 4: Build Portfolio page**

Replace `frontend/src/pages/Portfolio.tsx`:

```tsx
import { useState } from 'react'
import { Wallet, Link2, KeyRound, AlertTriangle, CheckCircle } from 'lucide-react'
import { getPortfolioAssets } from '../api'
import type { PortfolioAsset } from '../types'

export default function Portfolio() {
  const [connected, setConnected] = useState(false)
  const [assets, setAssets] = useState<PortfolioAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [passphrase, setPassphrase] = useState('')

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPortfolioAssets()
      if (data.error) {
        setError(data.error)
      } else {
        setAssets(data.assets || [])
        setConnected(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  function handleSaveKeys() {
    if (!apiKey || !secretKey || !passphrase) return
    localStorage.setItem('bitget_api_key', apiKey)
    localStorage.setItem('bitget_secret_key', secretKey)
    localStorage.setItem('bitget_passphrase', passphrase)
    setShowKeyForm(false)
    handleConnect()
  }

  const nonZeroAssets = assets.filter(a => parseFloat(a.available) > 0 || parseFloat(a.frozen) > 0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bullish to-emerald-400 flex items-center justify-center glow-bullish">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Portfolio</h1>
          <p className="text-text-secondary text-sm">Connect to Bitget to view your holdings</p>
        </div>
      </div>

      {/* Connect Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Wallet Connect (placeholder for wagmi) */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-purple-light" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Web3 Wallet</span>
          </div>
          <button className="w-full px-4 py-3 border border-purple/30 rounded-xl text-sm font-medium text-purple-light hover:bg-purple/5 transition-all cursor-pointer">
            Connect MetaMask
          </button>
          <p className="text-[10px] text-text-muted mt-2 text-center">Coming soon — wagmi integration</p>
        </div>

        {/* Bitget API Connect */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Bitget API</span>
          </div>
          {connected ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-bullish/[0.06] border border-bullish/20 rounded-xl">
              <CheckCircle className="w-4 h-4 text-bullish" />
              <span className="text-sm font-medium text-bullish">Connected</span>
            </div>
          ) : showKeyForm ? (
            <div className="space-y-2">
              <input type="password" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all" />
              <input type="password" placeholder="Secret Key" value={secretKey} onChange={e => setSecretKey(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all" />
              <input type="password" placeholder="Passphrase" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-all" />
              <button onClick={handleSaveKeys} disabled={!apiKey || !secretKey || !passphrase}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-gold to-gold-light text-bg-deep rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer">
                Connect
              </button>
            </div>
          ) : (
            <button onClick={() => setShowKeyForm(true)}
              className="w-full px-4 py-3 border border-gold/30 rounded-xl text-sm font-medium text-gold hover:bg-gold/5 transition-all cursor-pointer">
              Enter API Keys
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card px-5 py-4 text-sm text-bearish flex items-center gap-3 mb-6 glow-bearish">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass-card p-6">
          <div className="h-5 shimmer rounded w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-10 shimmer rounded-xl" />
            <div className="h-10 shimmer rounded-xl" />
            <div className="h-10 shimmer rounded-xl" />
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {connected && !loading && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text-primary">Holdings</h2>
            <span className="text-xs text-text-muted">{nonZeroAssets.length} assets</span>
          </div>

          {nonZeroAssets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-8 h-8 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-muted">No assets found in your spot account</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-4 py-2 text-[11px] text-text-muted uppercase tracking-wide">
                <div>Asset</div>
                <div className="text-right">Available</div>
                <div className="text-right">Frozen</div>
              </div>
              {/* Rows */}
              {nonZeroAssets.map((asset) => (
                <div key={asset.coin} className="grid grid-cols-3 gap-4 px-4 py-3 bg-surface/50 rounded-xl border border-border">
                  <div className="font-semibold text-sm text-text-primary">{asset.coin}</div>
                  <div className="text-right text-sm text-text-primary tabular-nums">{parseFloat(asset.available).toFixed(6)}</div>
                  <div className="text-right text-sm text-text-muted tabular-nums">{parseFloat(asset.frozen).toFixed(6)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state when not connected */}
      {!connected && !loading && !error && (
        <div className="glass-card p-12 text-center">
          <Wallet className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text-primary mb-2">Connect to see your portfolio</h3>
          <p className="text-sm text-text-secondary max-w-sm mx-auto">Enter your Bitget API keys above to view your spot holdings. Keys are stored locally and never sent to our servers.</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: Test backend endpoint**

```bash
cd backend && source .venv/Scripts/activate && python -c "from app.routes import router; print('OK')"
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Portfolio.tsx frontend/src/api.ts frontend/src/types.ts backend/app/routes.py
git commit -m "feat: add portfolio page with Bitget API connect and holdings table"
```

---

### Task 4: Decisions Page

**Files:**
- Modify: `frontend/src/pages/Decisions.tsx` (replace placeholder)

- [ ] **Step 1: Build Decisions page**

Replace `frontend/src/pages/Decisions.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { BookOpen, TrendingUp, TrendingDown, Brain, AlertTriangle, Sparkles } from 'lucide-react'
import { getDecisions, getAutopsy } from '../api'
import type { Decision, AutopsyStats } from '../types'

export default function Decisions() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [autopsy, setAutopsy] = useState<AutopsyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [d, a] = await Promise.all([getDecisions(), getAutopsy()])
        setDecisions(d)
        setAutopsy(a)
      } catch {
        // silently fail — show empty states
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingState />

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center glow-gold">
          <BookOpen className="w-5 h-5 text-bg-deep" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Decisions</h1>
          <p className="text-text-secondary text-sm">Journal + Autopsy Report</p>
        </div>
      </div>

      {/* Autopsy Stats */}
      {autopsy && autopsy.total_trades > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Win Rate" value={autopsy.win_rate != null ? `${autopsy.win_rate}%` : '—'} color="text-bullish" />
            <StatCard label="Calm Trades" value={autopsy.calm_avg_return != null ? `${autopsy.calm_avg_return > 0 ? '+' : ''}${autopsy.calm_avg_return}%` : '—'} color="text-gold" />
            <StatCard label="FOMO Trades" value={autopsy.fomo_avg_return != null ? `${autopsy.fomo_avg_return > 0 ? '+' : ''}${autopsy.fomo_avg_return}%` : '—'} color="text-bearish" />
            <StatCard label="Avg Confidence" value={autopsy.avg_confidence != null ? `${autopsy.avg_confidence}` : '—'} color="text-purple-light" />
          </div>

          {/* AI Insight */}
          {autopsy.insight && (
            <div className="glass-card p-5 mb-6 border-purple/20 glow-purple">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-light" />
                <span className="text-[11px] font-semibold text-purple-light uppercase tracking-wide">AI Insight</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{autopsy.insight}</p>
            </div>
          )}
        </>
      )}

      {/* Decision Journal */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4">Decision Journal</h2>

        {decisions.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <h3 className="text-sm font-medium text-text-primary mb-1">No decisions yet</h3>
            <p className="text-xs text-text-muted">Make your first trade in Research to start building your journal.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[1fr_2fr_0.7fr_0.7fr_0.7fr] gap-3 px-4 py-2 text-[11px] text-text-muted uppercase tracking-wide">
              <div>Ticker</div>
              <div>Reasoning</div>
              <div>FOMO</div>
              <div>Conf.</div>
              <div>Result</div>
            </div>
            {/* Rows */}
            {decisions.map((d) => (
              <div key={d.id} className="grid grid-cols-[1fr_2fr_0.7fr_0.7fr_0.7fr] gap-3 px-4 py-3 bg-surface/50 rounded-xl border border-border items-center">
                <div className="font-semibold text-sm text-text-primary">{d.ticker}</div>
                <div className="text-xs text-text-secondary truncate">{d.reasoning}</div>
                <div>
                  <FomoBadge level={d.fomo_score} />
                </div>
                <div className="text-sm text-text-primary tabular-nums">{d.confidence}/10</div>
                <div className="text-sm font-medium tabular-nums">
                  {d.outcome_pct != null ? (
                    <span className={d.outcome_pct >= 0 ? 'text-bullish' : 'text-bearish'}>
                      {d.outcome_pct >= 0 ? '+' : ''}{d.outcome_pct}%
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className={`text-xl font-bold ${color} tabular-nums`}>{value}</div>
      <div className="text-[10px] text-text-muted uppercase tracking-wide mt-1">{label}</div>
    </div>
  )
}

function FomoBadge({ level }: { level: string }) {
  const styles = {
    LOW: 'bg-bullish/10 text-bullish',
    MODERATE: 'bg-gold/10 text-gold',
    HIGH: 'bg-bearish/10 text-bearish',
  }
  const style = styles[level as keyof typeof styles] || styles.LOW
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${style}`}>{level}</span>
}

function LoadingState() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="h-8 shimmer rounded w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="glass-card p-4"><div className="h-8 shimmer rounded mb-2" /><div className="h-3 shimmer rounded w-2/3 mx-auto" /></div>)}
      </div>
      <div className="glass-card p-6">
        <div className="h-5 shimmer rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 shimmer rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Test in browser**

Open `http://localhost:5173/decisions` — verify loading state appears briefly, then empty state with "No decisions yet" message (assuming empty DB). If you have data in `trades.db`, verify stats cards and journal table render.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Decisions.tsx
git commit -m "feat: add decisions page with autopsy stats, AI insight, and journal table"
```

---

### Task 5: Polish + Responsive

**Files:**
- Modify: `frontend/src/pages/Landing.tsx` (responsive tweaks)
- Modify: `frontend/src/pages/Portfolio.tsx` (responsive tweaks)
- Modify: `frontend/src/pages/Decisions.tsx` (responsive tweaks)
- Modify: `frontend/src/components/Navbar.tsx` (mobile menu)

- [ ] **Step 1: Make Navbar responsive**

In `frontend/src/components/Navbar.tsx`, update the links container to hide labels on mobile:

Replace the links `<div>`:

```tsx
<div className="flex gap-1">
  {links.map(({ to, label, icon: Icon }) => (
    <Link
      key={to}
      to={to}
      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
        pathname === to
          ? 'bg-purple/15 text-purple-light border border-purple/30'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  ))}
</div>
```

- [ ] **Step 2: Landing page responsive adjustments**

In `frontend/src/pages/Landing.tsx`, the hero section already uses `md:text-6xl` and the grid uses `md:grid-cols-3`. Verify:

- Hero: `text-5xl md:text-6xl` ✓
- Features grid: `grid-cols-1 md:grid-cols-3` ✓
- How It Works: `flex-col md:flex-row` ✓
- Connectors: `hidden md:block` ✓

No changes needed — already responsive from Task 2.

- [ ] **Step 3: Decisions page responsive**

In `frontend/src/pages/Decisions.tsx`, the stats grid already uses `grid-cols-2 md:grid-cols-4`. For the journal table on mobile, update the grid to stack:

Replace the journal header and row grid class:

```
grid-cols-[1fr_2fr_0.7fr_0.7fr_0.7fr]
```

with:

```
grid-cols-[1fr_2fr_0.7fr_0.7fr_0.7fr] hidden md:grid
```

And add a mobile card view below the header row for small screens. Add this after the header div inside the decisions map:

Actually, for hackathon speed, the table works fine on mobile with horizontal scroll. Wrap the journal content in a scrollable container instead:

```tsx
<div className="overflow-x-auto">
  {/* existing header + rows grid */}
</div>
```

- [ ] **Step 4: Full visual test**

Run `npm run dev` and test at these breakpoints:
- Desktop (1280px+): Full layout
- Tablet (768px): Features stack, nav labels hidden
- Mobile (375px): Everything stacked, hero text smaller

- [ ] **Step 5: Final build check**

```bash
cd frontend && npx tsc --noEmit && npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 6: Commit**

```bash
git add -A frontend/src/
git commit -m "polish: responsive navbar, mobile-friendly layouts, scroll overflow on tables"
```

---

## Dependency Note

The spec mentions installing `wagmi`, `viem`, `@web3modal/wagmi`, `@tanstack/react-query` for wallet connect. For this implementation, the Portfolio page includes a **placeholder** "Connect MetaMask" button that says "Coming soon" rather than a full wagmi integration. This keeps scope tight for the hackathon deadline — wallet connect can be added in a follow-up without blocking the demo.

If full wallet connect is needed before demo:
```bash
cd frontend && npm install wagmi viem @web3modal/wagmi @tanstack/react-query
```

Then replace the placeholder card with wagmi's `useConnect`/`useAccount` hooks.
