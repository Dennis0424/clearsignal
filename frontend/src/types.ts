export interface ModuleScore {
  module_name: string
  z_score: number
  vote: 'bullish' | 'bearish' | 'neutral'
}

export interface AnalyzeResponse {
  ticker: string
  verdict: string
  confluence_count: number
  total_modules: number
  shock_detected: boolean
  scores: ModuleScore[]
  explanation: string | null
}

export interface TradeLogEntry {
  id: number
  timestamp: string
  ticker: string
  verdict: string
  confluence_count: number
  total_modules: number
  shock_detected: number
  scores_json: string
}

export interface CompareResponse {
  ticker: string
  clearsignal_verdict: string
  clearsignal_confluence: number
  clearsignal_explanation: string | null
  llm_raw_answer: string | null
}
