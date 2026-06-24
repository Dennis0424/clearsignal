import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, ReferenceLine, Legend,
} from 'recharts'
import { ChartLine, Activity } from 'lucide-react'

interface EquityPoint { date: string; clearsignal: number; buy_hold: number; spy: number }
interface Signal { date: string; verdict: string; price: number; action: string; pnl_pct?: number }
interface Trade { entry_date: string; entry_price: number; exit_date: string; exit_price: number; pnl_pct: number; verdict_entry: string }
interface Stats {
  total_return_pct: number; buy_hold_return_pct: number; spy_return_pct: number
  alpha_vs_spy: number; max_drawdown_pct: number; sharpe_ratio: number
  win_rate_pct: number; total_trades: number
}
interface BacktestResult {
  ticker: string; period: string; start_date: string; end_date: string
  equity_curve: EquityPoint[]; signals: Signal[]; stats: Stats; trades: Trade[]
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  const color = positive === undefined ? 'text-text-primary' : positive ? 'text-bullish' : 'text-bearish'
  return (
    <div className="glass-card p-4 flex flex-col gap-1">
      <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
      {sub && <span className="text-xs text-text-muted">{sub}</span>}
    </div>
  )
}

function ShimmerZone({ height = 'h-64' }: { height?: string }) {
  return <div className={`glass-card ${height} shimmer`} />
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-xs space-y-1">
      <p className="text-text-muted font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: ${p.value?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  )
}

export default function Backtest() {
  const [ticker, setTicker] = useState('NVDA')
  const [period, setPeriod] = useState<'1y' | '2y'>('2y')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)

  async function runBacktest() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/backtest?ticker=${ticker.toUpperCase()}&period=${period}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data: BacktestResult = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ChartLine className="w-5 h-5 text-accent" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Backtest</h1>
          <p className="text-xs text-text-muted">Replay ClearSignal's signal engine over historical data</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <input
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && runBacktest()}
          placeholder="Ticker (e.g. NVDA)"
          className="min-w-0 flex-1 max-w-xs bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
        />
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {(['1y', '2y'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${period === p ? 'bg-accent text-bg-deep' : 'text-text-muted hover:text-text-primary'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={runBacktest}
          disabled={loading}
          className="px-4 py-2 bg-accent text-bg-deep rounded-lg text-sm font-semibold hover:bg-accent-light transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Backtest'}
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 border-bearish/30 text-bearish text-sm">{error}</div>
      )}

      {/* Zone 1 — Equity Curve */}
      {loading ? <ShimmerZone height="h-72" /> : result && (
        <div className="glass-card p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Equity Curve</h2>
          <p className="text-xs text-text-muted mb-4">
            {result.start_date} → {result.end_date} · Starting capital $10,000
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={result.equity_curve} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="csGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bhGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false}
                interval={Math.floor(result.equity_curve.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="clearsignal" name="ClearSignal" stroke="#10b981" strokeWidth={2}
                fill="url(#csGrad)" dot={false} isAnimationActive animationDuration={1200} />
              <Area type="monotone" dataKey="buy_hold" name={`${result.ticker} Buy & Hold`} stroke="#a1a1aa"
                strokeWidth={1.5} fill="url(#bhGrad)" dot={false} isAnimationActive animationDuration={1200} />
              <Area type="monotone" dataKey="spy" name="S&P 500 (SPY)" stroke="#f59e0b"
                strokeWidth={1.5} fill="url(#spyGrad)" dot={false} isAnimationActive animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Zone 2 — Price + Signal Markers */}
      {loading ? <ShimmerZone height="h-64" /> : result && (
        <div className="glass-card p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Price Chart + Signals</h2>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={result.equity_curve.map((pt, i) => ({
              ...pt,
              price: result.equity_curve[i].buy_hold / (result.equity_curve[0].buy_hold / 100),
            }))} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false}
                interval={Math.floor(result.equity_curve.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="buy_hold" name={`${result.ticker} Price`} stroke="#a1a1aa"
                strokeWidth={1.5} dot={false} isAnimationActive={false} />
              {result.signals.filter(s => s.action === 'enter').map(s => (
                <ReferenceLine key={`buy-${s.date}`} x={s.date} stroke="#10b981" strokeDasharray="3 3"
                  label={{ value: '▲', position: 'top', fill: '#10b981', fontSize: 10 }} />
              ))}
              {result.signals.filter(s => s.action === 'exit').map(s => (
                <ReferenceLine key={`sell-${s.date}`} x={s.date} stroke="#ef4444" strokeDasharray="3 3"
                  label={{ value: '▼', position: 'top', fill: '#ef4444', fontSize: 10 }} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1"><span className="text-bullish">▲</span> BUY signal</span>
            <span className="flex items-center gap-1"><span className="text-bearish">▼</span> SELL signal</span>
          </div>
        </div>
      )}

      {/* Zone 3 — Stats + Trade Log */}
      {loading ? <ShimmerZone height="h-48" /> : result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Return" value={`${result.stats.total_return_pct > 0 ? '+' : ''}${result.stats.total_return_pct}%`}
              sub={`vs ${result.stats.buy_hold_return_pct}% buy & hold`} positive={result.stats.total_return_pct > result.stats.buy_hold_return_pct} />
            <StatCard label="Alpha vs S&P" value={`${result.stats.alpha_vs_spy > 0 ? '+' : ''}${result.stats.alpha_vs_spy}%`}
              positive={result.stats.alpha_vs_spy > 0} />
            <StatCard label="Max Drawdown" value={`${result.stats.max_drawdown_pct}%`}
              positive={result.stats.max_drawdown_pct > -15} />
            <StatCard label="Sharpe Ratio" value={`${result.stats.sharpe_ratio}`}
              sub="annualised" positive={result.stats.sharpe_ratio > 1} />
            <StatCard label="Win Rate" value={`${result.stats.win_rate_pct}%`}
              sub={`${result.stats.total_trades} trades`} positive={result.stats.win_rate_pct > 50} />
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Trade Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    <th className="px-4 py-2 text-left font-medium">Entry</th>
                    <th className="px-4 py-2 text-right font-medium">Entry $</th>
                    <th className="px-4 py-2 text-left font-medium">Exit</th>
                    <th className="px-4 py-2 text-right font-medium">Exit $</th>
                    <th className="px-4 py-2 text-right font-medium">P&L</th>
                    <th className="px-4 py-2 text-left font-medium">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">No completed trades</td></tr>
                  )}
                  {result.trades.map((t, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-2 font-mono text-text-secondary">{t.entry_date}</td>
                      <td className="px-4 py-2 font-mono text-right text-text-primary">${t.entry_price}</td>
                      <td className="px-4 py-2 font-mono text-text-secondary">{t.exit_date}</td>
                      <td className="px-4 py-2 font-mono text-right text-text-primary">${t.exit_price}</td>
                      <td className={`px-4 py-2 font-mono text-right font-semibold ${t.pnl_pct >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                        {t.pnl_pct > 0 ? '+' : ''}{t.pnl_pct}%
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${t.verdict_entry === 'STRONG_BUY' ? 'bg-bullish/20 text-bullish' : 'bg-accent/10 text-accent'}`}>
                          {t.verdict_entry}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <div className="glass-card p-12 flex flex-col items-center gap-3 text-center">
          <Activity className="w-8 h-8 text-text-muted" />
          <p className="text-text-secondary text-sm">Enter a ticker and run the backtest to see results</p>
          <p className="text-text-muted text-xs">Uses 2 years of daily OHLCV data · Same signal engine as live research</p>
        </div>
      )}
    </div>
  )
}
