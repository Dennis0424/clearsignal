import { motion } from 'motion/react'

interface Props {
  signals: {
    fomo_count: number
    social_count: number
    near_high: boolean
    price_spike: boolean
  }
  ticker: string
}

function calcScore(signals: Props['signals']): number {
  let score = 0
  score += Math.min(signals.fomo_count * 15, 30)
  score += Math.min(signals.social_count * 3, 30)
  if (signals.near_high) score += 20
  if (signals.price_spike) score += 20
  return Math.min(score, 100)
}

function getLabel(score: number): string {
  if (score <= 20) return 'Extreme Fear'
  if (score <= 40) return 'Fear'
  if (score <= 60) return 'Neutral'
  if (score <= 80) return 'Greed'
  return 'Extreme Greed'
}

function getLabelColor(score: number): string {
  if (score <= 20) return 'text-accent'
  if (score <= 40) return 'text-accent'
  if (score <= 60) return 'text-gold'
  if (score <= 80) return 'text-bearish'
  return 'text-bearish'
}

export default function FearGreedGauge({ signals, ticker }: Props) {
  const score = calcScore(signals)
  const label = getLabel(score)
  const labelColor = getLabelColor(score)

  // SVG arc geometry
  const cx = 125
  const cy = 120
  const r = 90
  const strokeWidth = 12

  // Semicircle arc (180 degrees, from left to right)
  const arcLength = Math.PI * r // half circumference
  const dashOffset = arcLength * (1 - score / 100)

  // Needle angle: -90deg (left, score=0) to +90deg (right, score=100)
  const needleAngle = -90 + (score / 100) * 180

  // Needle tip position for the pulsing dot
  const needleLength = 70
  const needleRad = (needleAngle - 90) * (Math.PI / 180)
  const tipX = cx + needleLength * Math.cos(needleRad)
  const tipY = cy + needleLength * Math.sin(needleRad)

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 w-[250px] flex flex-col items-center">
      <span className="text-xs text-text-muted uppercase tracking-wide mb-2">
        {ticker} Fear/Greed
      </span>

      <div className="relative w-[250px] h-[140px]">
        <svg
          viewBox="0 0 250 140"
          className="w-full h-full"
          fill="none"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Background arc (muted) */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-border"
            fill="none"
          />

          {/* Filled arc (gradient) */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            stroke="url(#gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
          />

          {/* Needle */}
          <motion.line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - needleLength}
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            className="text-text-primary"
            style={{ originX: `${cx}px`, originY: `${cy}px` }}
            animate={{ rotate: needleAngle }}
            transition={{ type: 'spring', stiffness: 60, damping: 12 }}
          />

          {/* Needle pivot dot */}
          <circle cx={cx} cy={cy} r={4} className="fill-text-primary" />

          {/* Pulsing tip dot */}
          <motion.circle
            cx={tipX}
            cy={tipY}
            r={4}
            className="fill-accent"
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>

        {/* Score number centered */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <span className="text-3xl font-mono font-bold text-text-primary">
            {score}
          </span>
        </div>
      </div>

      {/* Label */}
      <span className={`text-sm font-medium ${labelColor} mt-1`}>
        {label}
      </span>
    </div>
  )
}
