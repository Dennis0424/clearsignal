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

export interface ResearchResponse {
  ticker: string
  financials: Record<string, string | number>
  social: {
    ticker: string
    reddit: {
      reddit_mentions: number
      top_posts: Array<{
        subreddit: string
        title: string
        score: number
        num_comments: number
        url: string
      }>
    }
    news_headlines: Array<{
      title: string
      publisher: string
      link: string
    }>
    total_signals: number
  }
}

export interface DebateResponse extends ResearchResponse {
  debate: {
    ticker: string
    bull: string
    bear: string
    judge: string
  }
}

export interface TradeRequest {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  dry_run: boolean
}

export interface TradeResponse {
  dry_run?: boolean
  symbol?: string
  side?: string
  quantity?: number
  price?: number | null
  order_type?: string
  message?: string
  error?: string
  success?: boolean
  order_id?: string
}

export interface PricePoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface ChartResponse {
  ticker: string
  period: string
  data: PricePoint[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  ticker: string
  question: string
  answer: string
}

export interface FomoSignal {
  signal: string
  message: string
  severity: 'moderate' | 'high'
}

export interface RegretScenario {
  drawdown_pct: number
  loss: number
}

export interface FomoCheckResponse {
  ticker: string
  current_price: number
  risk_level: 'LOW' | 'MODERATE' | 'HIGH'
  signals: FomoSignal[]
  signal_count: number
  regret: {
    position_value: number
    scenarios: RegretScenario[]
  }
  warning: string
}

export interface Decision {
  id: number
  ticker: string
  side: string
  quantity: number
  price: number
  fomo_score: string
  fomo_signals: string
  reasoning: string
  confidence: number
  time_horizon: string
  outcome_price: number | null
  outcome_pct: number | null
  created_at: string
  resolved_at: string | null
}

export interface AutopsyStats {
  total_trades: number
  fomo_trades: number
  calm_trades: number
  avg_confidence: number | null
  fomo_avg_return: number | null
  calm_avg_return: number | null
  win_rate: number | null
  resolved_count: number
  insight: string | null
}

export interface PortfolioAsset {
  coin: string
  available: string
  frozen: string
  locked: string
  uTime: string
}

export interface PortfolioResponse {
  assets?: PortfolioAsset[]
  error?: string
}
