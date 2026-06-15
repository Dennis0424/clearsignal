import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'motion/react'
import { Search, TrendingUp, TrendingDown, Scale, MessageCircle, Newspaper, DollarSign, BarChart3, ShoppingCart, CheckCircle, AlertTriangle, Zap, Microscope, Send, Bot, User, Shield, Brain } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { debateTicker, executeTrade, getChartData, chatWithStock, fomoCheck, saveDecision } from '../api'
import type { DebateResponse, TradeResponse, PricePoint, ChatMessage, FomoCheckResponse } from '../types'

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

export default function DeepDive() {
  const [ticker, setTicker] = useState('')
  const [activeTicker, setActiveTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DebateResponse | null>(null)
  const [chartData, setChartData] = useState<PricePoint[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticker.trim()) return
    const t = ticker.trim().toUpperCase()
    setActiveTicker(t)
    setLoading(true)
    setError(null)
    setData(null)
    setChartData([])

    try {
      const [debateResult, chart] = await Promise.all([
        debateTicker(t),
        getChartData(t),
      ])
      setData(debateResult)
      setChartData(chart.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={pageVariants} initial="hidden" animate="visible">
      <motion.div className="mb-10" variants={itemVariants}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Microscope className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Deep Dive</h1>
            <p className="text-text-secondary text-sm">Multi-agent research + Bull vs Bear debate</p>
          </div>
        </div>
      </motion.div>

      <motion.form onSubmit={handleSubmit} className="flex gap-3 mb-10" variants={itemVariants}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker (e.g. AAPL)"
            className="w-full pl-11 pr-4 py-3 bg-bg-elevated border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 text-sm transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !ticker.trim()}
          className="px-6 py-3 bg-accent text-bg-deep rounded-xl font-medium text-sm hover:bg-accent-light transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Analyzing...' : 'Research & Debate'}
        </button>
      </motion.form>

      {loading && <LoadingState />}
      {error && (
        <div className="glass-card px-5 py-4 text-sm text-bearish flex items-center gap-3 glow-bearish">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {data && <Results data={data} chartData={chartData} activeTicker={activeTicker} />}
    </motion.div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="h-5 shimmer rounded w-1/4 mb-4" />
        <div className="h-48 shimmer rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="glass-card p-6">
            <div className="h-5 shimmer rounded w-1/3 mb-5" />
            <div className="space-y-3">
              <div className="h-3 shimmer rounded w-full" />
              <div className="h-3 shimmer rounded w-4/5" />
              <div className="h-3 shimmer rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
      <div className="glass-card p-6">
        <div className="h-5 shimmer rounded w-1/4 mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 shimmer rounded-xl" />
          <div className="h-32 shimmer rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function Results({ data, chartData, activeTicker }: { data: DebateResponse; chartData: PricePoint[]; activeTicker: string }) {
  const { financials, social, debate, ticker } = data

  return (
    <div className="space-y-6">
      {chartData.length > 0 && <PriceChart data={chartData} ticker={ticker} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialsCard data={financials} />
        <SocialCard data={social} />
      </div>
      <DebatePanel debate={debate} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradePanel ticker={ticker} price={Number(financials.current_price) || 0} />
        <ChatPanel ticker={activeTicker} />
      </div>
    </div>
  )
}

function PriceChart({ data, ticker }: { data: PricePoint[]; ticker: string }) {
  const latest = data[data.length - 1]
  const first = data[0]
  const change = latest && first ? ((latest.close - first.close) / first.close * 100) : 0
  const isPositive = change >= 0

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border">
            <TrendingUp className="w-4 h-4 text-text-secondary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">{ticker} Price</h2>
            <span className="text-xs text-text-secondary">3 month history</span>
          </div>
        </div>
        {latest && (
          <div className="text-right">
            <div className="text-xl font-bold text-text-primary tabular-nums">${latest.close.toFixed(2)}</div>
            <div className={`text-xs font-medium tabular-nums ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </div>
          </div>
        )}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
              labelStyle={{ color: '#8a94a6' }}
              itemStyle={{ color: '#f1f5f9' }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function FinancialsCard({ data }: { data: Record<string, string | number> }) {
  const fmt = (v: number, type: 'currency' | 'pct' | 'ratio') => {
    if (type === 'currency') {
      const n = Number(v)
      if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
      if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
      if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
      return `$${n.toFixed(2)}`
    }
    if (type === 'pct') return `${(Number(v) * 100).toFixed(1)}%`
    return String(Number(v).toFixed(2))
  }

  const metrics = [
    { label: 'Market Cap', key: 'market_cap', type: 'currency' as const, icon: DollarSign },
    { label: 'P/E Ratio', key: 'pe_ratio', type: 'ratio' as const, icon: BarChart3 },
    { label: 'Revenue', key: 'revenue', type: 'currency' as const, icon: DollarSign },
    { label: 'Rev Growth', key: 'revenue_growth', type: 'pct' as const, icon: TrendingUp },
    { label: 'Profit Margin', key: 'profit_margin', type: 'pct' as const, icon: TrendingUp },
    { label: 'Debt/Equity', key: 'debt_to_equity', type: 'ratio' as const, icon: Scale },
  ]

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-gold" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">{data.company_name || data.ticker}</h2>
          <span className="text-xs text-text-secondary">Financials</span>
        </div>
      </div>

      <div className="flex items-baseline gap-3 mb-5">
        {data.current_price && (
          <span className="text-3xl font-bold text-text-primary tabular-nums">${Number(data.current_price).toFixed(2)}</span>
        )}
        {data.sector && (
          <span className="px-2.5 py-1 text-xs bg-accent/10 text-accent rounded-lg font-medium">{String(data.sector)}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map(({ label, key, type, icon: Icon }) => {
          const val = data[key]
          if (val == null) return null
          return (
            <div key={key} className="flex items-center gap-2.5 px-3 py-2.5 bg-surface rounded-xl border border-border">
              <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-text-muted uppercase tracking-wide">{label}</div>
                <div className="text-sm font-semibold text-text-primary tabular-nums">{fmt(Number(val), type)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {data.recommendation && (
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
          <span className="text-xs text-text-muted">Analyst Consensus</span>
          <span className="px-2 py-0.5 text-xs font-semibold bg-gold/10 text-gold rounded-md">{String(data.recommendation).toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}

function SocialCard({ data }: { data: DebateResponse['social'] }) {
  const { reddit, news_headlines } = data

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Social & News</h2>
          <span className="text-xs text-text-secondary">Pulse</span>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="flex-1 px-4 py-3 bg-surface rounded-xl border border-border text-center">
          <div className="text-2xl font-bold text-gold tabular-nums">{reddit.reddit_mentions}</div>
          <div className="text-[11px] text-text-muted uppercase tracking-wide mt-0.5">Reddit</div>
        </div>
        <div className="flex-1 px-4 py-3 bg-surface rounded-xl border border-border text-center">
          <div className="text-2xl font-bold text-accent tabular-nums">{news_headlines.length}</div>
          <div className="text-[11px] text-text-muted uppercase tracking-wide mt-0.5">News</div>
        </div>
      </div>

      {reddit.top_posts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2.5">Trending on Reddit</h3>
          <div className="space-y-2">
            {reddit.top_posts.slice(0, 3).map((post, i) => (
              <div key={i} className="flex items-start gap-2 text-xs px-3 py-2 bg-surface rounded-lg border border-border">
                <span className="text-gold font-medium shrink-0">r/{post.subreddit}</span>
                <span className="text-text-primary truncate flex-1">{post.title}</span>
                <span className="text-text-muted shrink-0 tabular-nums">{post.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {news_headlines.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Newspaper className="w-3 h-3" /> Recent Headlines
          </h3>
          <div className="space-y-1.5">
            {news_headlines.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs py-1.5">
                <span className="text-text-muted shrink-0 w-16 truncate">{item.publisher}</span>
                <span className="text-text-primary">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DebatePanel({ debate }: { debate: DebateResponse['debate'] }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <div ref={ref} className="rounded-xl overflow-hidden border border-border">
      {/* Header bar — full width dark strip */}
      <div className="bg-bg-elevated border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-[0.18em]">Multi-Agent Debate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-bullish animate-pulse" />
          <span className="text-[10px] font-mono text-text-muted">live</span>
        </div>
      </div>

      {/* Arena — two columns, no padding between, hard split */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Bull side */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.05 }}
          className="relative p-6 bg-bullish/[0.04] border-r border-border"
        >
          {/* Colored top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-bullish/60" />

          {/* Character header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-bullish/10 border border-bullish/20 flex items-center justify-center text-xl leading-none select-none">
              🐂
            </div>
            <div>
              <div className="text-xs font-black text-bullish uppercase tracking-[0.12em]">Bull Case</div>
              <div className="text-[10px] text-text-muted font-mono">long thesis</div>
            </div>
          </div>

          <p className="text-sm text-text-primary/85 leading-relaxed">{debate.bull}</p>

          {/* Bottom tag */}
          <div className="mt-4 pt-3 border-t border-bullish/10 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-bullish" />
            <span className="text-[10px] font-mono text-bullish/70">Arguing: BUY</span>
          </div>
        </motion.div>

        {/* Bear side */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.05 }}
          className="relative p-6 bg-bearish/[0.04]"
        >
          {/* Colored top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-bearish/60" />

          {/* Character header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-bearish/10 border border-bearish/20 flex items-center justify-center text-xl leading-none select-none">
              🐻
            </div>
            <div>
              <div className="text-xs font-black text-bearish uppercase tracking-[0.12em]">Bear Case</div>
              <div className="text-[10px] text-text-muted font-mono">short thesis</div>
            </div>
          </div>

          <p className="text-sm text-text-primary/85 leading-relaxed">{debate.bear}</p>

          {/* Bottom tag */}
          <div className="mt-4 pt-3 border-t border-bearish/10 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-bearish" />
            <span className="text-[10px] font-mono text-bearish/70">Arguing: SELL</span>
          </div>
        </motion.div>
      </div>

      {/* Verdict — full width, distinct treatment */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.3 }}
        className="relative border-t border-border bg-bg-card px-6 py-5"
      >
        {/* Top accent — neutral */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-bullish/40 via-text-muted/20 to-bearish/40" />

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-lg leading-none shrink-0 select-none mt-0.5">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-text-primary uppercase tracking-[0.12em]">Judge Verdict</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-bg-elevated border border-border text-text-muted rounded uppercase tracking-wide">AI Impartial</span>
            </div>
            <p className="text-sm text-text-primary/85 leading-relaxed">{debate.judge}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function TradePanel({ ticker, price }: { ticker: string; price: number }) {
  const [step, setStep] = useState<'input' | 'fomo' | 'journal' | 'done'>('input')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [fomoData, setFomoData] = useState<FomoCheckResponse | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [confidence, setConfidence] = useState(5)
  const [horizon, setHorizon] = useState('1w')
  const [tradeResult, setTradeResult] = useState<TradeResponse | null>(null)

  const symbol = `${ticker}USDT`

  async function handleFomoCheck() {
    if (!quantity || Number(quantity) <= 0) return
    setLoading(true)
    try {
      const data = await fomoCheck(ticker, Number(quantity))
      setFomoData(data)
      setStep('fomo')
    } catch {
      setFomoData(null)
      setStep('fomo')
    } finally { setLoading(false) }
  }

  async function handleExecute() {
    setLoading(true)
    try {
      await saveDecision({ ticker, side: 'buy', quantity: Number(quantity), price, fomo_score: fomoData?.risk_level || 'LOW', fomo_signals: fomoData?.signals.map(s => s.signal) || [], reasoning, confidence, time_horizon: horizon })
      const result = await executeTrade({ symbol, side: 'buy', quantity: Number(quantity), dry_run: false })
      setTradeResult(result)
      setStep('done')
    } catch {
      setTradeResult({ error: 'Trade failed' })
      setStep('done')
    } finally { setLoading(false) }
  }

  const riskColor = fomoData?.risk_level === 'HIGH' ? 'bearish' : fomoData?.risk_level === 'MODERATE' ? 'gold' : 'bullish'

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-bullish/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-bullish" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Smart Trade</h2>
          <span className="text-xs text-text-secondary">FOMO-protected via Bitget</span>
        </div>
      </div>

      {step === 'input' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted uppercase tracking-wide mb-1.5">Symbol</label>
              <div className="px-3 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm font-medium text-text-primary tabular-nums">{symbol}</div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted uppercase tracking-wide mb-1.5">Quantity</label>
              <input type="number" step="any" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00"
                className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 tabular-nums transition-all duration-200" />
            </div>
          </div>
          {price > 0 && quantity && (
            <div className="px-3 py-2 bg-surface rounded-lg border border-border flex items-center justify-between">
              <span className="text-xs text-text-muted">Estimated Total</span>
              <span className="text-sm font-semibold text-gold tabular-nums">${(Number(quantity) * price).toFixed(2)}</span>
            </div>
          )}
          <button onClick={handleFomoCheck} disabled={loading || !quantity}
            className="w-full px-4 py-2.5 bg-accent text-bg-deep rounded-xl text-sm font-medium hover:bg-accent-light transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> {loading ? 'Checking...' : 'Check & Trade'}
          </button>
        </div>
      )}

      {step === 'fomo' && (
        <div className="space-y-4">
          <div className={`px-4 py-3 rounded-xl border ${riskColor === 'bearish' ? 'bg-bearish/[0.06] border-bearish/20' : riskColor === 'gold' ? 'bg-gold/[0.06] border-gold/20' : 'bg-bullish/[0.06] border-bullish/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-4 h-4 ${riskColor === 'bearish' ? 'text-bearish' : riskColor === 'gold' ? 'text-gold' : 'text-bullish'}`} />
              <span className={`text-sm font-semibold ${riskColor === 'bearish' ? 'text-bearish' : riskColor === 'gold' ? 'text-gold' : 'text-bullish'}`}>
                FOMO Risk: {fomoData?.risk_level || 'LOW'}
              </span>
            </div>
            <p className="text-xs text-text-primary/80 leading-relaxed">{fomoData?.warning || 'No significant FOMO signals detected.'}</p>
            {fomoData && fomoData.signals.length > 0 && (
              <div className="mt-2 space-y-1">
                {fomoData.signals.map((s, i) => (
                  <div key={i} className="text-[11px] text-text-secondary flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${s.severity === 'high' ? 'bg-bearish' : 'bg-gold'}`} />
                    {s.message}
                  </div>
                ))}
              </div>
            )}
          </div>
          {fomoData?.regret && (
            <div className="px-4 py-3 bg-surface rounded-xl border border-border">
              <h4 className="text-[11px] text-text-muted uppercase tracking-wide mb-2">Regret Simulator</h4>
              <div className="space-y-1.5">
                {fomoData.regret.scenarios.map(s => (
                  <div key={s.drawdown_pct} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">If drops {s.drawdown_pct}%:</span>
                    <span className="font-semibold text-bearish tabular-nums">-${s.loss.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2.5">
            <button onClick={() => setStep('input')} className="flex-1 px-4 py-2.5 bg-surface border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-surface-hover transition-all cursor-pointer">Reconsider</button>
            <button onClick={() => setStep('journal')} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gold to-gold-light text-bg-deep rounded-xl text-sm font-semibold hover:opacity-90 transition-all cursor-pointer">I Understand, Proceed</button>
          </div>
        </div>
      )}

      {step === 'journal' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-text-primary">Decision Journal</span>
          </div>
          <div>
            <label className="block text-[11px] text-text-muted uppercase tracking-wide mb-1.5">Why are you buying {ticker} today?</label>
            <textarea value={reasoning} onChange={e => setReasoning(e.target.value)} rows={2} placeholder="Your reasoning..."
              className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 resize-none transition-all duration-200" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted uppercase tracking-wide mb-1.5">Confidence</label>
              <input type="range" min={1} max={10} value={confidence} onChange={e => setConfidence(Number(e.target.value))} className="w-full accent-emerald-500" />
              <div className="text-center text-sm font-semibold text-accent tabular-nums">{confidence}/10</div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted uppercase tracking-wide mb-1.5">Horizon</label>
              <select value={horizon} onChange={e => setHorizon(e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-xl text-sm text-text-primary focus:outline-none cursor-pointer">
                <option value="1d">1 Day</option><option value="1w">1 Week</option><option value="1m">1 Month</option><option value="3m">3 Months</option>
              </select>
            </div>
          </div>
          <button onClick={handleExecute} disabled={loading || !reasoning.trim()}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-bullish to-emerald-400 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" /> {loading ? 'Executing...' : 'Record & Execute Trade'}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-3">
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 ${tradeResult?.error ? 'bg-bearish/[0.06] border border-bearish/20 text-bearish' : 'bg-bullish/[0.06] border border-bullish/20 text-bullish'}`}>
            {tradeResult?.error ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{tradeResult?.error || tradeResult?.message || 'Trade executed & decision recorded'}</span>
          </div>
          <p className="text-xs text-text-muted text-center">Your prediction will be tracked. Check Autopsy to see how you did.</p>
          <button onClick={() => { setStep('input'); setQuantity(''); setReasoning(''); setFomoData(null); setTradeResult(null) }}
            className="w-full px-4 py-2 bg-surface border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-surface-hover transition-all cursor-pointer">New Trade</button>
        </div>
      )}
    </div>
  )
}

function ChatPanel({ ticker }: { ticker: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || chatLoading) return

    const question = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setChatLoading(true)

    try {
      const result = await chatWithStock(ticker, question)
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that question. Try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="glass-card p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-gold" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-primary">Ask AI</h2>
          <span className="text-xs text-text-secondary">Chat about {ticker}</span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">Ask anything about {ticker}</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {['Is it overvalued?', 'What are the risks?', 'Should I buy now?'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q) }}
                  className="px-2.5 py-1 text-[11px] bg-surface border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-border-light transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-gold" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent/10 text-text-primary border border-accent/20'
                : 'bg-surface text-text-primary border border-border'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3 h-3 text-accent" />
              </div>
            )}
          </div>
        ))}
        {chatLoading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3 h-3 text-gold" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-surface border border-border">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask about ${ticker}...`}
          className="flex-1 px-3 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={chatLoading || !input.trim()}
          className="px-3 py-2.5 bg-gold/10 border border-gold/20 text-gold rounded-xl hover:bg-gold/20 transition-all duration-200 disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
