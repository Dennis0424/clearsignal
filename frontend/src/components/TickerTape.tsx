const TICKERS = [
  { symbol: 'BTC', price: 104832.5, change: 2.14 },
  { symbol: 'ETH', price: 3912.8, change: -0.87 },
  { symbol: 'NVDA', price: 210.69, change: 1.35 },
  { symbol: 'AAPL', price: 298.01, change: 0.42 },
  { symbol: 'TSLA', price: 341.2, change: -1.92 },
  { symbol: 'SOL', price: 172.55, change: 3.21 },
  { symbol: 'AMZN', price: 225.8, change: 0.68 },
];

function TickerItem({ symbol, price, change }: (typeof TICKERS)[number]) {
  const isPositive = change >= 0;
  return (
    <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="font-semibold text-text-primary text-xs tracking-wide">
        {symbol}
      </span>
      <span className="font-mono text-xs text-text-muted">
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="inline-flex items-center gap-1">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            isPositive ? 'bg-accent ticker-pulse-green' : 'bg-bearish'
          }`}
        />
        <span
          className={`font-mono text-xs font-medium ${
            isPositive ? 'text-accent' : 'text-bearish'
          }`}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(2)}%
        </span>
      </span>
      <span className="text-text-muted/30 text-xs select-none">|</span>
    </span>
  );
}

export default function TickerTape() {
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
          {TICKERS.map((t) => (
            <TickerItem key={t.symbol} {...t} />
          ))}
          {TICKERS.map((t) => (
            <TickerItem key={`dup-${t.symbol}`} {...t} />
          ))}
        </div>
      </div>
    </>
  );
}
