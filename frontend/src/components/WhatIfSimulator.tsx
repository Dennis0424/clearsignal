import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Clock } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartPoint {
  date: string
  price: number
}

interface SimResult {
  startPrice: number
  endPrice: number
  percentChange: number
  profitLoss: number
  chartData: ChartPoint[]
}

interface Props {
  defaultTicker?: string
}

export default function WhatIfSimulator({ defaultTicker }: Props) {
  const [ticker, setTicker] = useState(defaultTicker || 'BTC')
  const [amount, setAmount] = useState(1000)
  const [daysAgo, setDaysAgo] = useState(30)
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSimulate() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(
        `/whatif?ticker=${encodeURIComponent(ticker)}&amount=${amount}&days_ago=${daysAgo}`
      )
      if (!res.ok) throw new Error('Failed to fetch')
      const data: SimResult = await res.json()
      setResult(data)
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const isProfit = result ? result.profitLoss >= 0 : true
  const finalValue = result ? amount + result.profitLoss : 0

  return (
    <div className="ring-1 ring-white/5 p-1.5 rounded-[1.5rem]">
      <div className="bg-bg-card border border-border rounded-[calc(1.5rem-0.375rem)] p-6">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <Clock className="w-4.5 h-4.5 text-accent" />
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-text-primary">
              What If?
            </h3>
            <p className="text-[10px] font-mono text-text-muted tracking-wide">
              Time-travel your trades
            </p>
          </div>
        </div>

        {/* Inputs Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Ticker */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wide text-text-muted mb-1">
              Ticker
            </label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono text-text-primary outline-none focus:border-accent transition-colors"
              placeholder="BTC"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wide text-text-muted mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              min={1}
              className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Days Ago Slider */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wide text-text-muted mb-1">
              Days Ago — {daysAgo}
            </label>
            <input
              type="range"
              min={7}
              max={365}
              step={1}
              value={daysAgo}
              onChange={(e) => setDaysAgo(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-bg-elevated cursor-pointer accent-[#10b981] mt-2"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
              <span>7d</span>
              <span>365d</span>
            </div>
          </div>
        </div>

        {/* Simulate Button */}
        <motion.button
          onClick={handleSimulate}
          disabled={loading || !ticker}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-mono font-semibold uppercase tracking-wider rounded-xl py-2.5 transition-colors cursor-pointer"
        >
          {loading ? 'Simulating...' : 'Simulate'}
        </motion.button>

        {/* Result Area */}
        <div className="mt-5 min-h-[180px]">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="h-10 rounded-lg bg-bg-elevated animate-pulse" />
                <div className="h-[120px] rounded-lg bg-bg-elevated animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-bg-elevated animate-pulse" />
              </motion.div>
            )}

            {!loading && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              >
                {/* Profit/Loss Number */}
                <div className="text-center mb-4">
                  <span
                    className={`text-3xl font-mono font-bold tabular-nums ${
                      isProfit ? 'text-accent' : 'text-bearish'
                    }`}
                  >
                    {isProfit ? '+' : ''}${result.profitLoss.toFixed(2)}
                  </span>
                  <span
                    className={`ml-2 text-lg font-mono tabular-nums ${
                      isProfit ? 'text-accent' : 'text-bearish'
                    }`}
                  >
                    ({isProfit ? '+' : ''}{result.percentChange.toFixed(1)}%)
                  </span>
                </div>

                {/* Mini Chart */}
                <div className="h-[120px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.chartData}>
                      <defs>
                        <linearGradient id="whatif-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={isProfit ? '#10b981' : '#ef4444'}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={isProfit ? '#10b981' : '#ef4444'}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        hide
                      />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Tooltip
                        contentStyle={{
                          background: '#1a1a1a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                        labelStyle={{ color: '#888' }}
                        itemStyle={{ color: isProfit ? '#10b981' : '#ef4444' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isProfit ? '#10b981' : '#ef4444'}
                        strokeWidth={2}
                        fill="url(#whatif-fill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Text */}
                <p className="text-xs font-mono text-text-muted text-center leading-relaxed">
                  If you invested ${amount.toLocaleString()} in {ticker} {daysAgo} days ago,
                  your position would be worth{' '}
                  <span className={isProfit ? 'text-accent' : 'text-bearish'}>
                    ${finalValue.toFixed(2)}
                  </span>{' '}
                  today
                </p>
              </motion.div>
            )}

            {!loading && !result && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-[180px]"
              >
                <p className="text-sm font-mono text-text-muted text-center">
                  Pick a ticker and timeframe to simulate
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
