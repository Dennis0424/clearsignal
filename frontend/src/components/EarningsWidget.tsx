import { motion } from 'motion/react'
import { Calendar, Check, X } from 'lucide-react'

interface EarningsData {
  ticker: string
  next_earnings: string | null
  earnings_history: Array<{
    date: string
    eps_estimate: number | null
    eps_actual: number | null
    surprise_pct: number | null
  }>
}

interface Props {
  data: EarningsData
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function EarningsWidget({ data }: Props) {
  const daysLeft = data.next_earnings ? daysUntil(data.next_earnings) : null
  const isNear = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14
  const recentHistory = data.earnings_history.slice(0, 4)

  return (
    <motion.div
      className="rounded-xl border border-border bg-bg-card p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-text-muted" />
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Next Earnings
        </span>
      </div>

      {/* Next Earnings Date */}
      <div className="mb-5">
        {data.next_earnings ? (
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold text-text-primary">
              {formatDate(data.next_earnings)}
            </span>
            <div className="flex items-center gap-1.5">
              {isNear && (
                <motion.span
                  className="inline-block w-2 h-2 rounded-full bg-gold"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <span className={`text-sm font-mono ${isNear ? 'text-gold' : 'text-text-secondary'}`}>
                {daysLeft !== null && daysLeft >= 0
                  ? `in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
                  : 'passed'}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-lg text-text-secondary">Not Scheduled</span>
        )}
      </div>

      {/* Earnings History */}
      {recentHistory.length > 0 && (
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted mb-2 block">
            Recent Earnings
          </span>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-bg-elevated text-text-muted">
                  <th className="text-left px-3 py-1.5 font-medium">Date</th>
                  <th className="text-right px-3 py-1.5 font-medium">Est</th>
                  <th className="text-right px-3 py-1.5 font-medium">Actual</th>
                  <th className="text-right px-3 py-1.5 font-medium">Surprise</th>
                  <th className="text-center px-3 py-1.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((entry, i) => {
                  const beat =
                    entry.eps_actual !== null && entry.eps_estimate !== null
                      ? entry.eps_actual >= entry.eps_estimate
                      : null

                  return (
                    <tr
                      key={i}
                      className="border-t border-border"
                    >
                      <td className="px-3 py-2 text-text-secondary">
                        {formatDateShort(entry.date)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-text-secondary">
                        {entry.eps_estimate !== null ? entry.eps_estimate.toFixed(2) : '--'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-text-primary">
                        {entry.eps_actual !== null ? entry.eps_actual.toFixed(2) : '--'}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${
                        entry.surprise_pct !== null
                          ? entry.surprise_pct >= 0 ? 'text-accent' : 'text-bearish'
                          : 'text-text-muted'
                      }`}>
                        {entry.surprise_pct !== null
                          ? `${entry.surprise_pct >= 0 ? '+' : ''}${entry.surprise_pct.toFixed(1)}%`
                          : '--'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {beat === true && <Check className="w-3.5 h-3.5 text-accent inline-block" />}
                        {beat === false && <X className="w-3.5 h-3.5 text-bearish inline-block" />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
