import { useState, useEffect } from 'react'

const DEFAULT_TICKERS = [
  { symbol: 'BTC', coinPair: 'BTCUSDT', fallback: 104832.5, fallbackChg: 2.14 },
  { symbol: 'ETH', coinPair: 'ETHUSDT', fallback: 3912.8, fallbackChg: -0.87 },
  { symbol: 'SOL', coinPair: 'SOLUSDT', fallback: 172.55, fallbackChg: 3.21 },
  { symbol: 'BNB', coinPair: 'BNBUSDT', fallback: 695.0, fallbackChg: 0.91 },
  { symbol: 'XRP', coinPair: 'XRPUSDT', fallback: 2.31, fallbackChg: -1.44 },
  { symbol: 'DOGE', coinPair: 'DOGEUSDT', fallback: 0.1831, fallbackChg: 1.22 },
]

type TickerData = {
  symbol: string
  price: number
  change: number
}

async function fetchPrices(): Promise<TickerData[]> {
  const results = await Promise.allSettled(
    DEFAULT_TICKERS.map(async (t) => {
      const r = await fetch(`/price/${t.coinPair}`)
      const d = await r.json()
      if (d.last_price && d.change_24h != null) {
        return {
          symbol: t.symbol,
          price: parseFloat(d.last_price),
          change: parseFloat(d.change_24h) * 100,
        }
      }
      return { symbol: t.symbol, price: t.fallback, change: t.fallbackChg }
    })
  )
  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { symbol: DEFAULT_TICKERS[i].symbol, price: DEFAULT_TICKERS[i].fallback, change: DEFAULT_TICKERS[i].fallbackChg }
  )
}

function TickerItem({ symbol, price, change }: TickerData) {
  const isPositive = change >= 0
  return (
    <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="font-semibold text-text-primary text-xs tracking-wide">{symbol}</span>
      <span className="font-mono text-xs text-text-muted">
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 4 : 2 })}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-accent ticker-pulse-green' : 'bg-bearish'}`} />
        <span className={`font-mono text-xs font-medium ${isPositive ? 'text-accent' : 'text-bearish'}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
      </span>
      <span className="text-text-muted/30 text-xs select-none">|</span>
    </span>
  )
}

export default function TickerTape() {
  const [tickers, setTickers] = useState<TickerData[]>(
    DEFAULT_TICKERS.map(t => ({ symbol: t.symbol, price: t.fallback, change: t.fallbackChg }))
  )

  useEffect(() => {
    // Initial fetch
    fetchPrices().then(setTickers).catch(() => null)
    // Refresh every 30 seconds
    const id = setInterval(() => {
      fetchPrices().then(setTickers).catch(() => null)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ticker-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .ticker-track {
          animation: ticker-scroll 30s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        .ticker-pulse-green {
          animation: ticker-pulse 2s ease-in-out infinite;
        }
      `}</style>
      <div className="h-8 bg-bg-elevated border-b border-border overflow-hidden flex items-center">
        <div className="ticker-track inline-flex w-max">
          {tickers.map(t => <TickerItem key={t.symbol} {...t} />)}
          {tickers.map(t => <TickerItem key={`dup-${t.symbol}`} {...t} />)}
        </div>
      </div>
    </>
  )
}
