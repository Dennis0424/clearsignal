import { useState, useEffect } from 'react'
import { BookOpen, Brain, Sparkles } from 'lucide-react'
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
          <div className="overflow-x-auto">
            <div className="space-y-1 min-w-[600px]">
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
  const styles: Record<string, string> = {
    LOW: 'bg-bullish/10 text-bullish',
    MODERATE: 'bg-gold/10 text-gold',
    HIGH: 'bg-bearish/10 text-bearish',
  }
  const style = styles[level] || styles.LOW
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
