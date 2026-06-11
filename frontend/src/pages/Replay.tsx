import { useState } from 'react'
import { Calendar, Search, Loader2 } from 'lucide-react'
import { analyzeSignal } from '../api'
import type { AnalyzeResponse } from '../types'
import VerdictBadge from '../components/VerdictBadge'
import ScoreCard from '../components/ScoreCard'
import ShockBanner from '../components/ShockBanner'

export default function Replay() {
  const [ticker, setTicker] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticker.trim() || !date) return
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeSignal(ticker.trim())
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replay failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Replay Mode</h1>
        <p className="text-text-secondary">See what ClearSignal would have said on any past date</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (e.g. AAPL)"
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !ticker.trim() || !date}
          className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Replay'}
        </button>
      </form>

      {error && (
        <div className="text-center text-bearish text-sm">{error}</div>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-text-secondary text-sm">
              Replaying signal for <span className="text-text-primary font-semibold">{result.ticker}</span> on <span className="text-text-primary font-semibold">{date}</span>
            </p>
          </div>

          {result.shock_detected && <ShockBanner />}

          <VerdictBadge
            verdict={result.verdict}
            confluence={result.confluence_count}
            total={result.total_modules}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {result.scores.map((score) => (
              <ScoreCard key={score.module_name} score={score} />
            ))}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-text-secondary/60">
          <p>Pick a date and ticker to replay a past signal</p>
          <p className="text-sm mt-1">Compare what ClearSignal said vs what actually happened</p>
        </div>
      )}
    </div>
  )
}
