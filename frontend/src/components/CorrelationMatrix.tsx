import { motion } from 'motion/react'
import { GitCompare, AlertTriangle, ShieldCheck } from 'lucide-react'

interface CorrelationData {
  assets: string[]
  matrix: number[][]
}

interface Props {
  data: CorrelationData | null
  loading?: boolean
}

function getCellColor(value: number, isDiagonal: boolean): string {
  if (isDiagonal) return 'bg-white/5 text-text-muted'
  if (value >= 0.7) return 'bg-[#ef4444]/20 text-bearish'
  if (value >= 0.3) return 'bg-[#f59e0b]/15 text-gold'
  return 'bg-[#10b981]/15 text-accent'
}

function getCellBorder(value: number, isDiagonal: boolean): string {
  if (isDiagonal) return 'border-white/5'
  if (value >= 0.7) return 'border-[#ef4444]/30'
  if (value >= 0.3) return 'border-[#f59e0b]/25'
  return 'border-[#10b981]/25'
}

function getInterpretation(data: CorrelationData): {
  level: 'high' | 'moderate' | 'low'
  message: string
} {
  const n = data.assets.length
  let highCount = 0
  let totalPairs = 0

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      totalPairs++
      if (Math.abs(data.matrix[i][j]) >= 0.7) {
        highCount++
      }
    }
  }

  if (totalPairs === 0) {
    return { level: 'low', message: 'Add more assets to analyze correlation' }
  }

  const highRatio = highCount / totalPairs
  if (highRatio >= 0.5) {
    return {
      level: 'high',
      message: `HIGH RISK: ${highCount} of ${totalPairs} pairs are highly correlated`,
    }
  }
  if (highRatio >= 0.25) {
    return {
      level: 'moderate',
      message: `MODERATE: Some concentration detected across holdings`,
    }
  }
  return {
    level: 'low',
    message: 'DIVERSIFIED: Low cross-correlation detected',
  }
}

function SkeletonGrid() {
  const size = 4
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${size}, 1fr)` }}>
      {/* Header row */}
      <div />
      {Array.from({ length: size }).map((_, i) => (
        <div key={`h-${i}`} className="h-6 rounded bg-white/5 animate-pulse" />
      ))}
      {/* Grid rows */}
      {Array.from({ length: size }).map((_, row) => (
        <div key={`r-${row}`} className="contents">
          <div className="h-10 w-10 rounded bg-white/5 animate-pulse" />
          {Array.from({ length: size }).map((_, col) => (
            <div key={`c-${row}-${col}`} className="h-10 rounded bg-white/5 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function CorrelationMatrix({ data, loading }: Props) {
  const interpretation = data ? getInterpretation(data) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="w-full"
    >
      {/* Double-bezel outer shell */}
      <div className="ring-1 ring-white/5 p-1.5 rounded-[1.5rem]">
        {/* Inner core */}
        <div className="bg-bg-card rounded-[calc(1.5rem-0.375rem)] p-5">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-1">
            <GitCompare className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-wider text-text-primary font-medium">
              Correlation Matrix
            </span>
          </div>
          <p className="text-[11px] font-mono text-text-muted mb-5">
            How correlated are your holdings?
          </p>

          {/* Content */}
          {loading ? (
            <SkeletonGrid />
          ) : !data || data.assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <GitCompare className="w-6 h-6 text-text-muted/50" />
              <span className="text-xs font-mono text-text-muted">
                Add trades to see correlation
              </span>
            </div>
          ) : (
            <>
              {/* Matrix grid */}
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `auto repeat(${data.assets.length}, 1fr)`,
                }}
              >
                {/* Column headers */}
                <div />
                {data.assets.map((asset) => (
                  <div
                    key={`col-${asset}`}
                    className="text-center text-[10px] font-mono font-medium uppercase tracking-wide text-text-muted py-1"
                  >
                    {asset}
                  </div>
                ))}

                {/* Rows */}
                {data.assets.map((rowAsset, rowIdx) => (
                  <div key={`row-${rowAsset}`} className="contents">
                    {/* Row label */}
                    <div className="flex items-center justify-end pr-2 text-[10px] font-mono font-medium uppercase tracking-wide text-text-muted">
                      {rowAsset}
                    </div>

                    {/* Cells */}
                    {data.assets.map((_, colIdx) => {
                      const value = data.matrix[rowIdx][colIdx]
                      const isDiagonal = rowIdx === colIdx
                      const cellColor = getCellColor(value, isDiagonal)
                      const cellBorder = getCellBorder(value, isDiagonal)

                      return (
                        <motion.div
                          key={`cell-${rowIdx}-${colIdx}`}
                          className={`relative flex items-center justify-center rounded-lg border ${cellColor} ${cellBorder} py-2.5 cursor-default select-none`}
                          whileHover={{ scale: isDiagonal ? 1 : 1.08 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <span className="text-xs font-mono tabular-nums font-medium">
                            {value.toFixed(2)}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              {interpretation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5 border ${
                    interpretation.level === 'high'
                      ? 'bg-[#ef4444]/10 border-[#ef4444]/20'
                      : interpretation.level === 'moderate'
                        ? 'bg-[#f59e0b]/10 border-[#f59e0b]/20'
                        : 'bg-[#10b981]/10 border-[#10b981]/20'
                  }`}
                >
                  {interpretation.level === 'high' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-bearish shrink-0" />
                  ) : interpretation.level === 'moderate' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-gold shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                  )}
                  <span
                    className={`text-[11px] font-mono ${
                      interpretation.level === 'high'
                        ? 'text-bearish'
                        : interpretation.level === 'moderate'
                          ? 'text-gold'
                          : 'text-accent'
                    }`}
                  >
                    {interpretation.message}
                  </span>
                </motion.div>
              )}

              {/* Legend */}
              <div className="mt-3 flex items-center gap-4 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]/30" />
                  <span className="text-[9px] font-mono text-text-muted">High (&gt;0.7)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]/30" />
                  <span className="text-[9px] font-mono text-text-muted">Moderate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#10b981]/30" />
                  <span className="text-[9px] font-mono text-text-muted">Low/Negative</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
