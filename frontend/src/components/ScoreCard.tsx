import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ModuleScore } from '../types'

const MODULE_LABELS: Record<string, string> = {
  'technical-analysis': 'Technicals',
  'sentiment-analyst': 'Sentiment',
  'macro-analyst': 'Macro',
  'news-briefing': 'News',
  'market-intel': 'Market Intel',
}

interface Props {
  score: ModuleScore
}

export default function ScoreCard({ score }: Props) {
  const Icon = score.vote === 'bullish' ? TrendingUp : score.vote === 'bearish' ? TrendingDown : Minus
  const voteColor =
    score.vote === 'bullish' ? 'text-bullish' :
    score.vote === 'bearish' ? 'text-bearish' :
    'text-text-secondary'

  const barWidth = Math.abs(score.z_score) / 2 * 100
  const barColor = score.z_score > 0 ? 'bg-bullish' : score.z_score < 0 ? 'bg-bearish' : 'bg-text-secondary'

  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {MODULE_LABELS[score.module_name] || score.module_name}
        </span>
        <Icon className={`w-4 h-4 ${voteColor}`} />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-surface-dark rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <span className={`text-sm font-mono font-semibold ${voteColor}`}>
          {score.z_score > 0 ? '+' : ''}{score.z_score.toFixed(1)}
        </span>
      </div>
      <span className={`text-xs font-medium uppercase tracking-wide ${voteColor}`}>
        {score.vote}
      </span>
    </div>
  )
}
