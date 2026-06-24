import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react'
import { LineChart, Line } from 'recharts'

type ScanRow = {
  ticker: string
  asset_class: 'stock' | 'crypto'
  price: number
  change_pct: number
  sparkline: number[]
}

export default function MarketScanner() {
  const [rows, setRows] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all' | 'stock' | 'crypto'>('all')
  const navigate = useNavigate()

  async function loadScanner(silent = false) {
    if (!silent) setLoading(true)
    try {
      const r = await fetch('/scanner')
      const data: ScanRow[] = await r.json()
      // Sort by absolute change descending (biggest movers first)
      data.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
      setRows(data)
      setLastUpdated(new Date())
    } catch {
      // fail silently — stale data is fine
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadScanner()
    const id = setInterval(() => loadScanner(true), 60000)
    return () => clearInterval(id)
  }, [])

  const filtered = rows.filter(r => filter === 'all' || r.asset_class === filter)
  const gainers = filtered.filter(r => r.change_pct > 0).length
  const losers = filtered.filter(r => r.change_pct < 0).length

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <span className="text-sm font-semibold text-text-primary">Market Scanner</span>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-bullish font-mono">{gainers} up</span>
              <span className="text-[10px] text-bearish font-mono">{losers} down</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex gap-0.5 bg-bg-elevated border border-border rounded-lg p-0.5">
            {(['all', 'stock', 'crypto'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-md transition-all ${
                  filter === f ? 'bg-accent text-bg-deep' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadScanner()}
            disabled={loading}
            className="p-1.5 text-text-muted hover:text-text-secondary transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rows */}
      {loading && rows.length === 0 ? (
        <div className="p-5 space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-10 shimmer rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          <AnimatePresence>
            {filtered.map((row, i) => (
              <motion.button
                key={row.ticker}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => navigate(`/research?ticker=${row.ticker}`)}
                className="w-full grid grid-cols-[2.5fr_1fr_1fr_60px] gap-3 items-center px-5 py-3 hover:bg-white/[0.025] transition-colors text-left group cursor-pointer"
              >
                {/* Ticker + badge */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border ${
                    row.change_pct >= 0 ? 'bg-bullish/10 border-bullish/20 text-bullish' : 'bg-bearish/10 border-bearish/20 text-bearish'
                  }`}>
                    {row.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{row.ticker}</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wide">{row.asset_class}</div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-sm font-mono text-text-primary tabular-nums text-right">
                  ${row.price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: row.price < 1 ? 4 : 2
                  })}
                </div>

                {/* Change */}
                <div className={`text-sm font-mono font-semibold tabular-nums text-right flex items-center justify-end gap-1 ${row.change_pct >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                  {row.change_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {row.change_pct >= 0 ? '+' : ''}{row.change_pct.toFixed(2)}%
                </div>

                {/* Sparkline */}
                <div className="h-8 w-14 shrink-0">
                  {row.sparkline.length >= 2 && (
                    <LineChart width={56} height={32} data={row.sparkline.map((v, i) => ({ v, i }))}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke={row.change_pct >= 0 ? '#10b981' : '#ef4444'}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {lastUpdated && (
        <div className="px-5 py-2 border-t border-border text-[10px] text-text-muted font-mono">
          Updated {lastUpdated.toLocaleTimeString()} · auto-refresh 60s
        </div>
      )}
    </div>
  )
}
