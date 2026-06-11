import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { getHistory } from '../api'
import type { TradeLogEntry } from '../types'

export default function TradeLog() {
  const [entries, setEntries] = useState<TradeLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [])

  function exportCSV() {
    const headers = 'Date,Ticker,Verdict,Confluence,Modules,Shock\n'
    const rows = entries.map((e) =>
      `${e.timestamp},${e.ticker},${e.verdict},${e.confluence_count},${e.total_modules},${e.shock_detected ? 'Yes' : 'No'}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clearsignal-trade-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const verdictColor = (v: string) =>
    v.includes('BUY') ? 'text-bullish' :
    v.includes('SELL') ? 'text-bearish' :
    'text-text-secondary'

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sim Trade Log</h1>
          <p className="text-text-secondary text-sm mt-1">{entries.length} signals recorded</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-light transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-text-secondary/60">
          <p className="text-lg">No trades yet</p>
          <p className="text-sm mt-1">Analyze a ticker on the Dashboard to start logging</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-text-secondary text-left">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Ticker</th>
                <th className="px-4 py-3 font-medium">Verdict</th>
                <th className="px-4 py-3 font-medium">Confluence</th>
                <th className="px-4 py-3 font-medium">Shock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-surface-light/50 transition-colors">
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-primary">{entry.ticker}</td>
                  <td className={`px-4 py-3 font-semibold ${verdictColor(entry.verdict)}`}>
                    {entry.verdict.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {entry.confluence_count}/{entry.total_modules}
                  </td>
                  <td className="px-4 py-3">
                    {entry.shock_detected ? (
                      <span className="text-accent font-medium">Yes</span>
                    ) : (
                      <span className="text-text-secondary">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
