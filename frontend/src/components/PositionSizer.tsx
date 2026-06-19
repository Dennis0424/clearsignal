import { useState } from 'react'
import { motion } from 'motion/react'
import { Calculator, AlertTriangle } from 'lucide-react'

interface Props {
  currentPrice: number
  ticker: string
}

export default function PositionSizer({ currentPrice, ticker }: Props) {
  const [accountSize, setAccountSize] = useState(10000)
  const [riskPercent, setRiskPercent] = useState(2)
  const [stopLossPercent, setStopLossPercent] = useState(5)

  // Calculations
  const maxRiskDollars = accountSize * (riskPercent / 100)
  const stopLossDollars = currentPrice * (stopLossPercent / 100)
  const recommendedShares = stopLossDollars > 0 ? Math.floor(maxRiskDollars / stopLossDollars) : 0
  const positionValue = recommendedShares * currentPrice
  const positionPercent = accountSize > 0 ? (positionValue / accountSize) * 100 : 0

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4 text-accent" />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
          Position Sizer
        </span>
        <span className="ml-auto text-xs font-mono text-text-secondary">
          {ticker}
        </span>
      </div>

      {/* Inputs */}
      <div className="space-y-3 mb-5">
        {/* Account Size */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wide text-text-muted mb-1">
            Account Size ($)
          </label>
          <input
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(Number(e.target.value) || 0)}
            className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm font-mono tabular-nums text-text-primary outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Risk per Trade */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wide text-text-muted mb-1">
            Risk per Trade — {riskPercent}%
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={riskPercent}
            onChange={(e) => setRiskPercent(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-bg-elevated cursor-pointer accent-[#10b981]"
          />
          <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
            <span>1%</span>
            <span>10%</span>
          </div>
        </div>

        {/* Stop Loss */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wide text-text-muted mb-1">
            Stop Loss — {stopLossPercent}%
          </label>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={stopLossPercent}
            onChange={(e) => setStopLossPercent(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-bg-elevated cursor-pointer accent-[#10b981]"
          />
          <div className="flex justify-between text-[9px] font-mono text-text-muted mt-0.5">
            <span>2%</span>
            <span>20%</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-4" />

      {/* Results */}
      <div className="text-center mb-3">
        <span className="block text-[10px] font-mono uppercase tracking-wide text-text-muted mb-1">
          Recommended Shares
        </span>
        <motion.span
          key={recommendedShares}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="block text-3xl font-mono font-bold tabular-nums text-accent"
        >
          {recommendedShares}
        </motion.span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="block text-[9px] font-mono uppercase text-text-muted">Value</span>
          <span className="block text-sm font-mono tabular-nums text-text-primary">
            ${positionValue.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="block text-[9px] font-mono uppercase text-text-muted">Portfolio</span>
          <span className="block text-sm font-mono tabular-nums text-text-primary">
            {positionPercent.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="block text-[9px] font-mono uppercase text-text-muted">Max Loss</span>
          <span className="block text-sm font-mono tabular-nums text-bearish">
            -${maxRiskDollars.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Warning if position > 25% of account */}
      {positionPercent > 25 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 flex items-center gap-2 rounded-lg bg-bg-elevated border border-gold/30 px-3 py-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-gold shrink-0" />
          <span className="text-[10px] font-mono text-gold">
            Position exceeds 25% of account — consider reducing size
          </span>
        </motion.div>
      )}
    </div>
  )
}
