import { useState, useEffect, useRef } from 'react'
import { BookOpen, Brain, Sparkles, Flame, Activity, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getDecisions, getAutopsy } from '../api'
import AchievementBadges from '../components/AchievementBadges'
import type { Decision, AutopsyStats } from '../types'

// ── Behavioral Health Panel ─────────────────────────────────────
type DegenData = {
  score: number
  level: 'zen' | 'spicy' | 'degen'
  factors: Array<{ label: string; value: string; points: number }>
  message: string
}

type CooldownData = {
  active: boolean
  seconds_remaining: number
  minutes_remaining: number
  last_loss_pct: number | null
  last_loss_ticker: string | null
  message: string
}

function BehavioralHealthPanel() {
  const [degen, setDegen] = useState<DegenData | null>(null)
  const [cooldown, setCooldown] = useState<CooldownData | null>(null)
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    fetch('/degen-score').then(r => r.json()).then(setDegen).catch(() => null)
    fetch('/cooldown').then(r => r.json()).then(d => {
      setCooldown(d)
      setSecs(d.seconds_remaining || 0)
    }).catch(() => null)
  }, [])

  useEffect(() => {
    if (!cooldown?.active || secs <= 0) return
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown?.active, secs])

  if (!degen && !cooldown) return null

  const c = degen ? {
    zen: { text: 'text-accent', bar: 'bg-accent', border: 'border-accent/20', bg: 'bg-accent/5' },
    spicy: { text: 'text-gold', bar: 'bg-gold', border: 'border-gold/20', bg: 'bg-gold/5' },
    degen: { text: 'text-bearish', bar: 'bg-bearish', border: 'border-bearish/20', bg: 'bg-bearish/5' },
  }[degen.level] : null

  const coolMins = Math.floor(secs / 60)
  const coolSecs = secs % 60
  const coolPct = cooldown && cooldown.seconds_remaining > 0 ? (secs / cooldown.seconds_remaining) * 100 : 0

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18 }}
    >
      {/* Degen Score */}
      {degen && c && (
        <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.14em]">Degen Score</span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${c.text} uppercase tracking-wide px-2 py-0.5 rounded bg-bg-card border border-border`}>
              {{ zen: 'ZEN', spicy: 'SPICY', degen: 'DEGEN' }[degen.level]}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <motion.span
              className={`text-3xl font-black font-mono ${c.text} tabular-nums`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {degen.score}
            </motion.span>
            <span className="text-xs font-mono text-text-muted">/ 100</span>
          </div>
          <div className="w-full h-[3px] bg-bg-elevated rounded-full overflow-hidden mb-3">
            <motion.div
              className={`h-full ${c.bar} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${degen.score}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            />
          </div>
          {degen.factors.length > 0 && (
            <div className="space-y-1 mb-2">
              {degen.factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-text-muted">{f.label}</span>
                  <span className={c.text}>{f.value}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-text-muted leading-relaxed">{degen.message}</p>
        </div>
      )}

      {/* Cooldown Timer */}
      {cooldown && (
        <div className={`rounded-xl border p-5 ${cooldown.active ? 'border-bearish/30 bg-bearish/5' : 'border-border bg-bg-card'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.14em]">Cooldown</span>
            </div>
            {cooldown.active ? (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-bearish animate-pulse" />
                <span className="text-[10px] font-mono text-bearish uppercase tracking-wide">Active</span>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-accent uppercase tracking-wide px-2 py-0.5 rounded bg-accent/5 border border-accent/20">Clear</span>
            )}
          </div>
          {cooldown.active ? (
            <>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-black font-mono text-bearish tabular-nums">
                  {String(coolMins).padStart(2, '0')}:{String(coolSecs).padStart(2, '0')}
                </span>
                <span className="text-xs font-mono text-text-muted ml-1">remaining</span>
              </div>
              <div className="w-full h-[3px] bg-bearish/20 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full bg-bearish rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: `${coolPct}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              {cooldown.last_loss_ticker && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3 h-3 text-bearish/60" />
                  <span className="text-[10px] text-text-muted font-mono">
                    Last loss: {cooldown.last_loss_ticker} {cooldown.last_loss_pct?.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-black font-mono text-accent tabular-nums">00:00</span>
            </div>
          )}
          <p className="text-[11px] text-text-muted leading-relaxed">{cooldown.message}</p>
        </div>
      )}
    </motion.div>
  )
}

// ── P&L Cumulative Chart ──────────────────────────────────────
function PnLChart({ decisions }: { decisions: Decision[] }) {
  const resolved = decisions.filter(d => d.outcome_pct != null).reverse()
  if (resolved.length < 2) return null

  let cumulative = 0
  const chartData = resolved.map((d, i) => {
    cumulative += d.outcome_pct!
    return {
      index: i + 1,
      ticker: d.ticker,
      cumPnL: parseFloat(cumulative.toFixed(2)),
      trade: parseFloat(d.outcome_pct!.toFixed(2)),
    }
  })

  const lastVal = chartData[chartData.length - 1]?.cumPnL ?? 0
  const isPositive = lastVal >= 0

  return (
    <motion.div
      className="bg-bg-card border border-border rounded-xl p-5 mb-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-text-primary">Cumulative P&L</span>
        </div>
        <div className={`text-lg font-black font-mono tabular-nums ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
          {isPositive ? '+' : ''}{lastVal.toFixed(2)}%
        </div>
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 2" />
            <XAxis dataKey="index" hide />
            <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '11px' }}
              labelStyle={{ color: '#52525b', marginBottom: '2px' }}
              itemStyle={{ color: '#fafafa' }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.ticker || ''}
              formatter={(val: number) => [`${val >= 0 ? '+' : ''}${val}%`, 'Cumulative']}
            />
            <Area type="monotone" dataKey="cumPnL" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth={2} fill="url(#pnlGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted font-mono">
        <span>{resolved.length} resolved trades</span>
        <span className="text-bullish">{resolved.filter(d => d.outcome_pct! >= 0).length} wins</span>
        <span className="text-bearish">{resolved.filter(d => d.outcome_pct! < 0).length} losses</span>
      </div>
    </motion.div>
  )
}

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

// ── Decision Roast panel ───────────────────────────────────────
function RoastPanel({ hasDecisions }: { hasDecisions: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'revealed'>('idle')
  const [roast, setRoast] = useState('')
  const [displayed, setDisplayed] = useState('')
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleRoast() {
    if (!hasDecisions) return
    setState('loading')
    try {
      const res = await fetch('/roast')
      const data = await res.json()
      setRoast(data.roast || 'The market already roasted you enough.')
      setState('revealed')
    } catch {
      setRoast('The market already roasted you enough. My work here is done.')
      setState('revealed')
    }
  }

  // Typewriter effect for roast text
  useEffect(() => {
    if (state !== 'revealed' || !roast) return
    setDisplayed('')
    let i = 0
    const tick = () => {
      if (i <= roast.length) {
        setDisplayed(roast.slice(0, i))
        i++
        frameRef.current = setTimeout(tick, 22)
      }
    }
    tick()
    return () => { if (frameRef.current) clearTimeout(frameRef.current) }
  }, [state, roast])

  return (
    <motion.div
      className="bg-bg-card border border-border rounded-xl p-6 mb-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.15 }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center">
            <Flame className="w-4 h-4 text-bearish" />
          </div>
          <div>
            <div className="text-sm font-bold text-text-primary">Decision Roast</div>
            <div className="text-[11px] text-text-muted">AI reads your trades. Brutally.</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.button
              key="idle-btn"
              onClick={handleRoast}
              disabled={!hasDecisions}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={hasDecisions ? { scale: 1.03 } : {}}
              whileTap={hasDecisions ? { scale: 0.97 } : {}}
              className="px-4 py-2 rounded-lg bg-accent text-bg-deep text-xs font-bold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Roast Me
            </motion.button>
          )}
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-bearish animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-bearish animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-bearish animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          )}
          {state === 'revealed' && (
            <motion.button
              key="again-btn"
              onClick={() => { setState('idle'); setRoast(''); setDisplayed('') }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-mono text-text-muted hover:text-text-secondary transition-colors"
            >
              Reset
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Roast reveal area */}
      <AnimatePresence>
        {state === 'revealed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[1px] flex-1 bg-bearish/20" />
                <span className="text-[10px] font-mono text-bearish/60 uppercase tracking-[0.16em]">AI Verdict</span>
                <div className="h-[1px] flex-1 bg-bearish/20" />
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-mono">
                {displayed}
                {displayed.length < roast.length && (
                  <span className="inline-block w-[2px] h-[1em] bg-bearish align-middle ml-[1px] animate-pulse" />
                )}
              </p>
            </div>
          </motion.div>
        )}
        {state === 'idle' && !hasDecisions && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-text-muted"
          >
            Make some trades first. Give the AI something to work with.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

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
    <motion.div className="max-w-7xl mx-auto px-6 py-10" variants={pageVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="flex items-center gap-3 mb-8" variants={itemVariants}>
        <BookOpen className="w-5 h-5 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Decisions</h1>
          <p className="text-text-secondary text-sm">Journal + Autopsy Report</p>
        </div>
      </motion.div>

      {/* Behavioral Health Panel */}
      <BehavioralHealthPanel />

      {/* Autopsy Stats */}
      {autopsy && autopsy.total_trades > 0 && (
        <>
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}><StatCard label="Win Rate" value={autopsy.win_rate != null ? `${autopsy.win_rate}%` : '—'} color="text-bullish" /></motion.div>
            <motion.div variants={itemVariants}><StatCard label="Calm Trades" value={autopsy.calm_avg_return != null ? `${autopsy.calm_avg_return > 0 ? '+' : ''}${autopsy.calm_avg_return}%` : '—'} color="text-gold" /></motion.div>
            <motion.div variants={itemVariants}><StatCard label="FOMO Trades" value={autopsy.fomo_avg_return != null ? `${autopsy.fomo_avg_return > 0 ? '+' : ''}${autopsy.fomo_avg_return}%` : '—'} color="text-bearish" /></motion.div>
            <motion.div variants={itemVariants}><StatCard label="Avg Confidence" value={autopsy.avg_confidence != null ? `${autopsy.avg_confidence}` : '—'} color="text-accent" /></motion.div>
          </motion.div>

          {/* AI Insight */}
          {autopsy.insight && (
            <motion.div className="bg-bg-card border-y border-r border-border border-l-2 border-l-accent rounded-xl p-5 mb-6" variants={itemVariants} initial="hidden" animate="visible">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">AI Insight</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{autopsy.insight}</p>
            </motion.div>
          )}
        </>
      )}

      {/* P&L Chart */}
      {decisions.length >= 2 && <PnLChart decisions={decisions} />}

      {decisions.length > 0 && (
        <motion.div className="mb-6" variants={itemVariants} initial="hidden" animate="visible">
          <AchievementBadges decisions={decisions} />
        </motion.div>
      )}

      <RoastPanel hasDecisions={decisions.length > 0} />

      {/* Decision Journal */}
      <motion.div className="bg-bg-card border border-border rounded-xl p-6" variants={itemVariants} initial="hidden" animate="visible">
        <h2 className="text-base font-semibold text-text-primary mb-4">Decision Journal</h2>

        {decisions.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <h3 className="text-sm font-medium text-text-primary mb-1">No decisions yet</h3>
            <p className="text-xs text-text-muted">Make your first trade in Research to start building your journal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
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
                <div key={d.id} className="grid grid-cols-[1fr_2fr_0.7fr_0.7fr_0.7fr] gap-3 px-4 py-3 border-b border-border items-center">
                  <div className="font-semibold text-sm text-text-primary">{d.ticker}</div>
                  <div className="text-xs text-text-secondary truncate">{d.reasoning}</div>
                  <div>
                    <FomoBadge level={d.fomo_score} />
                  </div>
                  <div className="text-sm text-text-primary font-mono">{d.confidence}/10</div>
                  <div className="text-sm font-medium font-mono">
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
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 text-center">
      <div className={`text-xl font-bold ${color} font-mono`}>{value}</div>
      <div className="text-[10px] text-text-muted uppercase tracking-wide mt-1">{label}</div>
    </div>
  )
}

function FomoBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    LOW: 'text-bullish',
    MODERATE: 'text-gold',
    HIGH: 'text-bearish',
  }
  const style = styles[level] || styles.LOW
  return <span className={`text-[11px] font-semibold ${style}`}>{level}</span>
}

function LoadingState() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="h-8 shimmer rounded w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="bg-bg-card border border-border rounded-xl p-4"><div className="h-8 shimmer rounded mb-2" /><div className="h-3 shimmer rounded w-2/3 mx-auto" /></div>)}
      </div>
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <div className="h-5 shimmer rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 shimmer rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}
