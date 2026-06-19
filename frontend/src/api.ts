import type { AnalyzeResponse, CompareResponse, TradeLogEntry, ResearchResponse, DebateResponse, TradeRequest, TradeResponse, ChartResponse, ChatResponse, FomoCheckResponse, Decision, AutopsyStats, PortfolioResponse } from './types'

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

export async function compareSignal(ticker: string): Promise<CompareResponse> {
  const res = await fetch(`${BASE}/compare`, {
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

export async function researchTicker(ticker: string): Promise<ResearchResponse> {
  const res = await fetch(`${BASE}/research/${ticker.toUpperCase()}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function debateTicker(ticker: string): Promise<DebateResponse> {
  const res = await fetch(`${BASE}/debate/${ticker.toUpperCase()}`, { method: 'POST' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function executeTrade(trade: TradeRequest): Promise<TradeResponse> {
  const res = await fetch(`${BASE}/trade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trade),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getChartData(ticker: string, period = '3mo'): Promise<ChartResponse> {
  const res = await fetch(`${BASE}/chart/${ticker.toUpperCase()}?period=${period}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function chatWithStock(ticker: string, question: string): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat/${ticker.toUpperCase()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fomoCheck(ticker: string, quantity: number): Promise<FomoCheckResponse> {
  const res = await fetch(`${BASE}/fomo-check/${ticker.toUpperCase()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function saveDecision(decision: {
  ticker: string; side: string; quantity: number; price: number;
  fomo_score: string; fomo_signals: string[]; reasoning: string;
  confidence: number; time_horizon: string;
}): Promise<{ id: number; message: string }> {
  const res = await fetch(`${BASE}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decision),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getDecisions(): Promise<Decision[]> {
  const res = await fetch(`${BASE}/decision-log`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getAutopsy(): Promise<AutopsyStats> {
  const res = await fetch(`${BASE}/autopsy`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function getPortfolioAssets(): Promise<PortfolioResponse> {
  const res = await fetch(`${BASE}/portfolio/assets`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
