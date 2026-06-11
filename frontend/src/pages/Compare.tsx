import { useState } from 'react'
import { Search, Loader2, Zap, Bot } from 'lucide-react'
import { compareSignal } from '../api'
import type { CompareResponse } from '../types'

export default function Compare() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticker.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await compareSignal(ticker.trim())
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  const verdictColor = (v: string) =>
    v.includes('BUY') ? 'text-bullish' :
    v.includes('SELL') ? 'text-bearish' :
    'text-text-secondary'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Head-to-Head</h1>
        <p className="text-text-secondary">ClearSignal (deterministic) vs Raw LLM (probabilistic)</p>
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
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Compare'}
        </button>
      </form>

      {error && <div className="text-center text-bearish text-sm">{error}</div>}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface border border-bullish/30 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-bullish" />
              <h3 className="font-semibold text-text-primary">ClearSignal</h3>
              <span className="text-xs bg-bullish/20 text-bullish px-2 py-0.5 rounded-full ml-auto">Deterministic</span>
            </div>
            <div className={`text-2xl font-bold ${verdictColor(result.clearsignal_verdict)}`}>
              {result.clearsignal_verdict.replace('_', ' ')}
            </div>
            <p className="text-text-secondary text-sm">
              {result.clearsignal_confluence}/5 signals agree
            </p>
            {result.clearsignal_explanation && (
              <p className="text-text-primary text-sm leading-relaxed border-t border-border pt-3">
                {result.clearsignal_explanation}
              </p>
            )}
          </div>

          <div className="bg-surface border border-accent/30 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-text-primary">Raw LLM</h3>
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full ml-auto">Probabilistic</span>
            </div>
            {result.llm_raw_answer ? (
              <p className="text-text-primary text-sm leading-relaxed">
                {result.llm_raw_answer}
              </p>
            ) : (
              <p className="text-text-secondary text-sm italic">
                No API key configured — set LLM_API_KEY to enable comparison
              </p>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-text-secondary/60">
          <p>Same question to both — "Should I buy {ticker || 'X'}?"</p>
          <p className="text-sm mt-1">ClearSignal always gives the same answer. The LLM might not.</p>
        </div>
      )}
    </div>
  )
}
