import { Users, ArrowUp, ArrowDown } from 'lucide-react'
import { motion } from 'motion/react'

interface InsiderData {
  ticker: string
  transactions: Array<{
    date: string
    insider: string
    type: 'buy' | 'sell' | 'other'
    shares: number
    value: number
    text: string
  }>
  summary: {
    buys: number
    sells: number
    net_signal: 'bullish' | 'bearish' | 'neutral'
  }
}

interface Props {
  data: InsiderData
}

function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

function formatShares(shares: number): string {
  if (shares >= 1_000_000) return `${(shares / 1_000_000).toFixed(1)}M`
  if (shares >= 1_000) return `${(shares / 1_000).toFixed(0)}K`
  return shares.toLocaleString()
}

const signalConfig = {
  bullish: { label: 'Bullish', className: 'text-accent bg-accent/10 border-accent/30' },
  bearish: { label: 'Bearish', className: 'text-bearish bg-bearish/10 border-bearish/30' },
  neutral: { label: 'Neutral', className: 'text-text-muted bg-bg-elevated border-border' },
}

export default function InsiderWidget({ data }: Props) {
  const { transactions, summary } = data
  const visible = transactions.slice(0, 5)
  const signal = signalConfig[summary.net_signal]
  const total = summary.buys + summary.sells
  const buyPct = total > 0 ? (summary.buys / total) * 100 : 50

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="rounded-xl border border-border bg-bg-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Insider Activity
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${signal.className}`}>
          {signal.label}
        </span>
      </div>

      {/* Summary bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-accent font-medium">{summary.buys} Buys</span>
          <span className="text-bearish font-medium">{summary.sells} Sells</span>
        </div>
        <div className="h-2 w-full rounded-full bg-bg-elevated overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${buyPct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.2 }}
            className="h-full bg-accent rounded-l-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - buyPct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.25 }}
            className="h-full bg-bearish rounded-r-full"
          />
        </div>
      </div>

      {/* Transaction list */}
      {visible.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">
          No recent insider activity
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((tx, i) => (
            <motion.div
              key={`${tx.insider}-${tx.date}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 28,
                delay: 0.1 + i * 0.06,
              }}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-bg-elevated/50"
            >
              {/* Buy/Sell indicator */}
              <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                tx.type === 'buy' ? 'bg-accent/15' : tx.type === 'sell' ? 'bg-bearish/15' : 'bg-bg-elevated'
              }`}>
                {tx.type === 'buy' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-accent" />
                ) : tx.type === 'sell' ? (
                  <ArrowDown className="w-3.5 h-3.5 text-bearish" />
                ) : (
                  <span className="w-2 h-0.5 bg-text-muted rounded-full" />
                )}
              </div>

              {/* Insider name + date */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate font-medium">
                  {tx.insider}
                </p>
                <p className="text-xs text-text-muted">{tx.date}</p>
              </div>

              {/* Shares + value */}
              <div className="text-right shrink-0">
                <p className="text-sm font-mono text-text-primary">
                  {formatShares(tx.shares)}
                </p>
                <p className="text-xs font-mono text-text-secondary">
                  {formatValue(tx.value)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
