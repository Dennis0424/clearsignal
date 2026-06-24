# Backtest Engine Implementation Design

## Goal

Add a fully deterministic backtesting engine to ClearSignal that replays the existing Z-score confluence signal logic over 2 years of historical price data for any US stock, and visualises the equity curve vs buy-and-hold and S&P 500 benchmark.

## Architecture

### Data Flow

```
User enters ticker + "Run Backtest"
        │
GET /backtest?ticker=NVDA&period=2y
        │
backtest_engine.py
  ├── Fetch 2y OHLCV via yfinance (CurlSession)
  ├── Fetch 2y SPY OHLCV (benchmark)
  ├── Derive 5 signal proxies per day (pure price math)
  ├── Feed each day through existing normalize() + vote()
  ├── Simulate $10,000 portfolio (binary long/cash)
  └── Compute stats: return %, drawdown, Sharpe, win rate
        │
JSON response → React /backtest page
  ├── Zone 1: Equity curve (ClearSignal vs Buy&Hold vs S&P)
  ├── Zone 2: Price chart with BUY/SELL signal markers
  └── Zone 3: Stats cards + trade log table
```

### Signal Proxy Mapping

Each of the 5 ClearSignal modules is approximated from daily OHLCV. The same `normalize()` and `vote()` functions from `signal_engine/` are used unchanged — only the input source differs.

| Module | Proxy | Calculation |
|--------|-------|-------------|
| `technical-analysis` | RSI(14) | 14-day RSI; mean/std computed over a 60-day rolling window |
| `sentiment-analyst` | Volume ratio | `today_volume / 20d_avg_volume * 50`; mean=50, std=20 |
| `macro-analyst` | SMA deviation | `((price - SMA200) / SMA200) * 100`; rolling 60d mean/std |
| `news-briefing` | 5d momentum | `(close_today / close_5d_ago - 1) * 100`; rolling 60d mean/std |
| `market-intel` | Bollinger position | `(price - lower_band) / (upper_band - lower_band) * 100`; mean=50, std=20 |

Rolling mean/std windows use the prior 60 days only (no lookahead bias).

### Simulation Logic

- Starting capital: $10,000
- On BUY or STRONG_BUY signal: go 100% long at next day's open price
- On SELL or STRONG_SELL signal: exit to 100% cash at next day's open price
- On HOLD: maintain current position (long or cash)
- No transaction costs (keep it clean for the demo)
- Warmup period: first 200 days skipped (needed for SMA200 to stabilise); backtest runs on the remaining data

Benchmark 1 — Buy & Hold: $10,000 invested at first valid day, held to end.
Benchmark 2 — S&P 500: $10,000 in SPY at same start date, held to end.

### Stats Computed

| Metric | Formula |
|--------|---------|
| Total Return % | `(final_equity / 10000 - 1) * 100` |
| vs S&P Alpha | ClearSignal return − SPY return |
| Max Drawdown % | Max peak-to-trough decline in equity curve |
| Sharpe Ratio | `mean(daily_returns) / std(daily_returns) * sqrt(252)` |
| Win Rate % | Profitable trades / total closed trades |
| Total Trades | Count of BUY→SELL round trips |

---

## Backend

### New File: `backend/agents/backtest_engine.py`

Responsibilities:
- `fetch_ohlcv(ticker, period) -> pd.DataFrame` — yfinance fetch with CurlSession
- `compute_proxies(df) -> pd.DataFrame` — adds 5 signal columns to the OHLCV dataframe
- `run_backtest(ticker, period) -> dict` — full simulation, returns JSON-serialisable result

No new dependencies beyond what's already installed (yfinance, pandas, curl_cffi).

### New Route: `backend/app/routes.py`

```python
@router.get("/backtest")
async def backtest(ticker: str, period: str = "2y"):
```

Added to existing `routes.py`. Calls `run_backtest()` in a thread executor (same pattern as other routes).

### Response Schema

```json
{
  "ticker": "NVDA",
  "period": "2y",
  "start_date": "2024-06-24",
  "end_date": "2026-06-24",
  "equity_curve": [
    { "date": "2024-06-24", "clearsignal": 10000, "buy_hold": 10000, "spy": 10000 }
  ],
  "signals": [
    { "date": "2024-07-15", "verdict": "BUY", "price": 118.40, "action": "enter" },
    { "date": "2024-08-03", "verdict": "SELL", "price": 109.20, "action": "exit", "pnl_pct": -7.8 }
  ],
  "stats": {
    "total_return_pct": 84.2,
    "buy_hold_return_pct": 68.1,
    "spy_return_pct": 41.3,
    "alpha_vs_spy": 42.9,
    "max_drawdown_pct": -18.4,
    "sharpe_ratio": 1.82,
    "win_rate_pct": 62.5,
    "total_trades": 16
  },
  "trades": [
    { "entry_date": "2024-07-15", "entry_price": 118.40, "exit_date": "2024-08-03", "exit_price": 109.20, "pnl_pct": -7.8, "verdict_entry": "BUY" }
  ]
}
```

---

## Frontend

### New Page: `frontend/src/pages/Backtest.tsx`

Added to router at `/backtest`. Accessible from Navbar (new "Backtest" link with `ChartLine` icon).

### Layout — Three Visual Zones

**Zone 1 — Equity Curve (hero, full-width)**
- `AreaChart` from recharts, three series: ClearSignal (emerald fill), Buy & Hold (white/40% opacity), S&P 500 (gold/40% opacity)
- Animated on mount (`isAnimationActive={true}`, 1200ms)
- Custom tooltip showing all three values + date on crosshair hover
- Legend pills at top right

**Zone 2 — Price + Signal Markers**
- `ComposedChart`: `Line` for price, `ReferenceLine` (vertical dashed) at each signal date
- BUY signals: green upward triangle marker + label
- SELL signals: red downward triangle marker + label
- Clicking a signal marker scrolls the trade log to that trade

**Zone 3 — Stats Row + Trade Log**
- 5 stat cards in a responsive grid: Total Return, Alpha vs S&P, Max Drawdown, Sharpe Ratio, Win Rate
- Colour-coded: green if positive vs benchmark, red if negative
- Trade log: scrollable table, columns: Entry Date, Entry Price, Exit Date, Exit Price, P&L %, Verdict
- Each row colour-coded green (profit) / red (loss)

### Ticker Input

- Text input at top, defaults to `NVDA`
- "Run Backtest" button — triggers fetch, shows shimmer skeleton on all three zones while loading
- Period selector: `1y` / `2y` toggle pills (default `2y`)

### State Management

Local `useState` only — no global state needed. Loading / error / result states.

---

## Navbar Update

Add "Backtest" link to `Navbar.tsx` links array:
```tsx
{ to: '/backtest', label: 'Backtest', icon: ChartLine }
```

Add route to `App.tsx`:
```tsx
<Route path="/backtest" element={<AnimatedPage><Backtest /></AnimatedPage>} />
```

---

## Files Changed

| File | Action |
|------|--------|
| `backend/agents/backtest_engine.py` | Create |
| `backend/app/routes.py` | Add `/backtest` route |
| `frontend/src/pages/Backtest.tsx` | Create |
| `frontend/src/components/Navbar.tsx` | Add Backtest link |
| `frontend/src/App.tsx` | Add /backtest route |

---

## Out of Scope

- Transaction costs / slippage
- Short selling
- Position sizing (fixed at binary all-in/out)
- Multi-ticker portfolio backtest
- LLM-powered signal proxies (uses price math only)
- Caching / persistence of backtest results
