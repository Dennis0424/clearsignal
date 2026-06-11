import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { analyzeSignal } from '../api'
import type { AnalyzeResponse } from '../types'
import VerdictBadge from '../components/VerdictBadge'
import ScoreCard from '../components/ScoreCard'
import ShockBanner from '../components/ShockBanner'

export default function Dashboard() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticker.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeSignal(ticker.trim())
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Signal Dashboard</h1>
        <p className="text-text-secondary">Enter a ticker to get a deterministic, explainable signal</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL, TSLA, NVDA..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !ticker.trim()}
          className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className="text-center text-bearish text-sm">{error}</div>
      )}

      {result && (
        <div className="flex flex-col gap-6 animate-in fade-in">
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

          {result.explanation && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide">AI Explanation</h3>
              <p className="text-text-primary leading-relaxed">{result.explanation}</p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-16 text-text-secondary/60">
          <p className="text-lg">Enter a ticker above to analyze</p>
          <p className="text-sm mt-1">5 Bitget modules scored independently via Z-score normalization</p>
        </div>
      )}
    </div>
  )
}
