import type { AnalyzeResponse, TradeLogEntry } from './types'

const BASE = ''

export async function analyzeSignal(ticker: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getHistory(ticker?: string): Promise<TradeLogEntry[]> {
  const url = ticker ? `${BASE}/history?ticker=${ticker}` : `${BASE}/history`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
