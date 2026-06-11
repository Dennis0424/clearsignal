interface Props {
  verdict: string
  confluence: number
  total: number
}

export default function VerdictBadge({ verdict, confluence, total }: Props) {
  const color =
    verdict.includes('BUY') ? 'text-bullish border-bullish/40 bg-bullish/10' :
    verdict.includes('SELL') ? 'text-bearish border-bearish/40 bg-bearish/10' :
    'text-text-secondary border-border bg-surface-light'

  const label = verdict.replace('_', ' ')

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`px-8 py-4 rounded-2xl border-2 text-4xl font-bold tracking-tight ${color}`}>
        {label}
      </div>
      <p className="text-text-secondary text-sm">
        <span className="text-text-primary font-semibold">{confluence}/{total}</span> signals agree
      </p>
    </div>
  )
}
