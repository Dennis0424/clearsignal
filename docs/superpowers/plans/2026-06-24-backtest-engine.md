# Backtest Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic backtesting engine that replays ClearSignal's Z-score confluence logic over 2 years of historical price data, comparing it against buy-and-hold and S&P 500, with a rich 3-zone visualisation page.

**Architecture:** A new `backtest_engine.py` derives 5 price-based signal proxies from yfinance OHLCV data, feeds each day through the existing `normalize()` + `vote()` functions unchanged, simulates a $10k binary long/cash portfolio, and returns an equity curve + stats + trade log. A new `/backtest` React page renders the results in three zones: animated equity curve, price chart with signal markers, and stats cards + trade log.

**Tech Stack:** Python 3.11+ · FastAPI · yfinance · pandas · curl_cffi · React 19 · TypeScript · Tailwind CSS v4 · recharts · motion/react

## Global Constraints

- All Python runs inside `D:/clearsignal/.venv` — activate with `source .venv/Scripts/activate` (Windows) before any Python command
- Backend runs from `D:/clearsignal/backend/` — all `pytest` and `uvicorn` commands run from there
- Frontend runs from `D:/clearsignal/frontend/`
- No new pip dependencies — yfinance, pandas, curl_cffi already installed
- No new npm dependencies — recharts, motion/react, lucide-react already installed
- Follow existing route pattern: `loop.run_in_executor(None, fn)` for sync functions
- Follow existing frontend pattern: `AnimatedPage` wrapper in App.tsx, glass-card styling

---

### Task 1: Backtest Engine — Signal Proxies + Simulation Core

**Files:**
- Create: `backend/agents/backtest_engine.py`
- Create: `backend/tests/test_backtest_engine.py`

**Interfaces:**
- Produces:
  - `fetch_ohlcv(ticker: str, period: str) -> pd.DataFrame` — columns: Date(index), Open, High, Low, Close, Volume
  - `compute_proxies(df: pd.DataFrame) -> pd.DataFrame` — adds columns: rsi, volume_ratio, sma_dev, momentum_5d, bb_position
  - `run_backtest(ticker: str, period: str = "2y") -> dict` — returns full JSON-serialisable result matching response schema

- [ ] **Step 1: Write the failing tests**

```bash
cd D:/clearsignal/backend
```

Create `backend/tests/test_backtest_engine.py`:

```python
import pandas as pd
import numpy as np
import pytest
from agents.backtest_engine import fetch_ohlcv, compute_proxies, run_backtest


def make_ohlcv(n=300) -> pd.DataFrame:
    """Synthetic OHLCV: steady uptrend with some noise."""
    dates = pd.date_range("2023-01-01", periods=n, freq="B")
    close = 100 + np.cumsum(np.random.randn(n) * 0.5 + 0.1)
    close = np.maximum(close, 1.0)
    df = pd.DataFrame({
        "Open": close * 0.999,
        "High": close * 1.005,
        "Low": close * 0.995,
        "Close": close,
        "Volume": np.random.randint(1_000_000, 10_000_000, n).astype(float),
    }, index=dates)
    return df


def test_compute_proxies_adds_all_columns():
    df = make_ohlcv(300)
    result = compute_proxies(df)
    for col in ["rsi", "volume_ratio", "sma_dev", "momentum_5d", "bb_position"]:
        assert col in result.columns, f"Missing column: {col}"


def test_compute_proxies_no_lookahead():
    """Values at row i must not depend on rows after i."""
    df = make_ohlcv(300)
    result = compute_proxies(df)
    # Mutate a future row and recompute — row 200 should not change
    df2 = df.copy()
    df2.iloc[250:, df2.columns.get_loc("Close")] *= 10
    result2 = compute_proxies(df2)
    pd.testing.assert_series_equal(
        result["rsi"].iloc[:201],
        result2["rsi"].iloc[:201],
        check_names=False,
    )


def test_run_backtest_schema():
    result = run_backtest("AAPL", "1y")
    assert "ticker" in result
    assert "equity_curve" in result
    assert "stats" in result
    assert "trades" in result
    assert "signals" in result
    stats = result["stats"]
    for key in ["total_return_pct", "buy_hold_return_pct", "spy_return_pct",
                "alpha_vs_spy", "max_drawdown_pct", "sharpe_ratio",
                "win_rate_pct", "total_trades"]:
        assert key in stats, f"Missing stat: {key}"


def test_run_backtest_equity_curve_starts_at_10000():
    result = run_backtest("AAPL", "1y")
    assert result["equity_curve"][0]["clearsignal"] == 10000.0
    assert result["equity_curve"][0]["buy_hold"] == 10000.0
    assert result["equity_curve"][0]["spy"] == 10000.0


def test_run_backtest_no_negative_equity():
    result = run_backtest("AAPL", "1y")
    for point in result["equity_curve"]:
        assert point["clearsignal"] >= 0
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd D:/clearsignal/backend
source ../.venv/Scripts/activate
python -m pytest tests/test_backtest_engine.py -v
```

Expected: `ModuleNotFoundError: No module named 'agents.backtest_engine'`

- [ ] **Step 3: Implement `backtest_engine.py`**

Create `backend/agents/backtest_engine.py`:

```python
import math
import numpy as np
import pandas as pd
import yfinance as yf
from curl_cffi.requests import Session as CurlSession
from signal_engine.normalizer import normalize
from signal_engine.voter import vote
from signal_engine.models import SignalInput

STARTING_CAPITAL = 10_000.0
WARMUP_DAYS = 200
RSI_PERIOD = 14
BB_PERIOD = 20
ROLLING_WINDOW = 60
VOL_WINDOW = 20
MOMENTUM_DAYS = 5


def fetch_ohlcv(ticker: str, period: str = "2y") -> pd.DataFrame:
    session = CurlSession(impersonate="chrome")
    yf_ticker = ticker if not _is_crypto(ticker) else f"{ticker}-USD"
    stock = yf.Ticker(yf_ticker, session=session)
    df = stock.history(period=period, interval="1d")
    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df = df.dropna()
    return df


def _is_crypto(ticker: str) -> bool:
    return ticker.upper() in {"BTC", "ETH", "SOL", "BNB", "XRP"}


def _rsi(series: pd.Series, period: int = RSI_PERIOD) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def compute_proxies(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    close = df["Close"]
    volume = df["Volume"]

    # RSI(14)
    df["rsi"] = _rsi(close, RSI_PERIOD)

    # Volume ratio: today / 20d avg * 50
    vol_avg = volume.rolling(VOL_WINDOW, min_periods=1).mean().shift(1)
    df["volume_ratio"] = (volume / vol_avg.replace(0, np.nan)) * 50

    # SMA200 deviation %
    sma200 = close.rolling(200, min_periods=1).mean()
    df["sma_dev"] = ((close - sma200) / sma200) * 100

    # 5-day momentum %
    df["momentum_5d"] = (close / close.shift(MOMENTUM_DAYS) - 1) * 100

    # Bollinger position (20d, 2 std)
    sma20 = close.rolling(BB_PERIOD, min_periods=BB_PERIOD).mean()
    std20 = close.rolling(BB_PERIOD, min_periods=BB_PERIOD).std()
    lower = sma20 - 2 * std20
    upper = sma20 + 2 * std20
    band_width = (upper - lower).replace(0, np.nan)
    df["bb_position"] = ((close - lower) / band_width) * 100

    return df


def _rolling_mean_std(series: pd.Series, window: int = ROLLING_WINDOW):
    mean = series.rolling(window, min_periods=window // 2).mean().shift(1)
    std = series.rolling(window, min_periods=window // 2).std().shift(1)
    return mean, std


def _make_signal_inputs(row: pd.Series, proxy_stats: dict) -> list[SignalInput]:
    modules = [
        ("technical-analysis", "rsi"),
        ("sentiment-analyst", "volume_ratio"),
        ("macro-analyst", "sma_dev"),
        ("news-briefing", "momentum_5d"),
        ("market-intel", "bb_position"),
    ]
    inputs = []
    for module_name, col in modules:
        val = row.get(col, 50.0)
        mean = proxy_stats[col]["mean"].get(row.name, 50.0)
        std = proxy_stats[col]["std"].get(row.name, 10.0)
        if math.isnan(val) or math.isnan(mean):
            val, mean, std = 50.0, 50.0, 10.0
        if math.isnan(std) or std == 0:
            std = 10.0
        inputs.append(SignalInput(
            module_name=module_name,
            raw_value=float(val),
            historical_mean=float(mean),
            historical_std=float(std),
        ))
    return inputs


def _simulate(df: pd.DataFrame, proxy_stats: dict) -> tuple[list[dict], list[dict], list[dict]]:
    equity = STARTING_CAPITAL
    in_position = False
    entry_price = 0.0
    entry_date = None
    entry_verdict = ""

    equity_curve = []
    signals = []
    trades = []

    first_close = df["Close"].iloc[0]
    bh_shares = STARTING_CAPITAL / first_close

    for i, (date, row) in enumerate(df.iterrows()):
        date_str = date.strftime("%Y-%m-%d")
        close = float(row["Close"])
        open_price = float(row["Open"])

        # Determine today's verdict from yesterday's signal (signals fire at close, execute at open)
        if i == 0:
            equity_curve.append({
                "date": date_str,
                "clearsignal": round(STARTING_CAPITAL, 2),
                "buy_hold": round(STARTING_CAPITAL, 2),
                "spy": round(STARTING_CAPITAL, 2),  # filled in later
            })
            continue

        # Get previous day's signal inputs
        prev_row = df.iloc[i - 1]
        signal_inputs = _make_signal_inputs(prev_row, proxy_stats)
        scores = [normalize(s) for s in signal_inputs]
        verdict = vote(scores)
        verdict_str = verdict.verdict_type.value

        # Execute at today's open
        if verdict_str in ("BUY", "STRONG_BUY") and not in_position:
            in_position = True
            entry_price = open_price
            entry_date = date_str
            entry_verdict = verdict_str
            signals.append({"date": date_str, "verdict": verdict_str, "price": round(open_price, 2), "action": "enter"})

        elif verdict_str in ("SELL", "STRONG_SELL") and in_position:
            pnl_pct = round((open_price / entry_price - 1) * 100, 2)
            in_position = False
            signals.append({"date": date_str, "verdict": verdict_str, "price": round(open_price, 2), "action": "exit", "pnl_pct": pnl_pct})
            trades.append({
                "entry_date": entry_date,
                "entry_price": round(entry_price, 2),
                "exit_date": date_str,
                "exit_price": round(open_price, 2),
                "pnl_pct": pnl_pct,
                "verdict_entry": entry_verdict,
            })
            equity *= (1 + pnl_pct / 100)

        # Update equity value (mark-to-market if in position)
        if in_position:
            current_equity = equity * (close / entry_price)
        else:
            current_equity = equity

        bh_equity = bh_shares * close
        equity_curve.append({
            "date": date_str,
            "clearsignal": round(current_equity, 2),
            "buy_hold": round(bh_equity, 2),
            "spy": 0.0,  # filled after
        })

    return equity_curve, signals, trades


def _fill_spy(equity_curve: list[dict], spy_df: pd.DataFrame) -> list[dict]:
    if spy_df.empty:
        for pt in equity_curve:
            pt["spy"] = pt["buy_hold"]
        return equity_curve

    first_spy = float(spy_df["Close"].iloc[0])
    spy_shares = STARTING_CAPITAL / first_spy
    spy_by_date = {d.strftime("%Y-%m-%d"): float(c) for d, c in spy_df["Close"].items()}

    for pt in equity_curve:
        spy_close = spy_by_date.get(pt["date"])
        pt["spy"] = round(spy_shares * spy_close, 2) if spy_close else pt["spy"]

    return equity_curve


def _compute_stats(equity_curve: list[dict], trades: list[dict]) -> dict:
    cs_values = [pt["clearsignal"] for pt in equity_curve]
    bh_values = [pt["buy_hold"] for pt in equity_curve]
    spy_values = [pt["spy"] for pt in equity_curve if pt["spy"] > 0]

    final_cs = cs_values[-1]
    final_bh = bh_values[-1]
    final_spy = spy_values[-1] if spy_values else final_bh

    total_return = round((final_cs / STARTING_CAPITAL - 1) * 100, 2)
    bh_return = round((final_bh / STARTING_CAPITAL - 1) * 100, 2)
    spy_return = round((final_spy / STARTING_CAPITAL - 1) * 100, 2)

    # Max drawdown
    peak = STARTING_CAPITAL
    max_dd = 0.0
    for v in cs_values:
        if v > peak:
            peak = v
        dd = (v - peak) / peak * 100
        if dd < max_dd:
            max_dd = dd

    # Sharpe (annualised)
    daily_returns = pd.Series(cs_values).pct_change().dropna()
    sharpe = 0.0
    if daily_returns.std() > 0:
        sharpe = round(float(daily_returns.mean() / daily_returns.std() * math.sqrt(252)), 2)

    # Win rate
    wins = sum(1 for t in trades if t["pnl_pct"] > 0)
    win_rate = round(wins / len(trades) * 100, 1) if trades else 0.0

    return {
        "total_return_pct": total_return,
        "buy_hold_return_pct": bh_return,
        "spy_return_pct": spy_return,
        "alpha_vs_spy": round(total_return - spy_return, 2),
        "max_drawdown_pct": round(max_dd, 2),
        "sharpe_ratio": sharpe,
        "win_rate_pct": win_rate,
        "total_trades": len(trades),
    }


def run_backtest(ticker: str, period: str = "2y") -> dict:
    ticker = ticker.upper()

    df = fetch_ohlcv(ticker, period)
    spy_df = fetch_ohlcv("SPY", period)

    df = compute_proxies(df)

    # Build rolling mean/std for each proxy (no lookahead)
    proxy_cols = ["rsi", "volume_ratio", "sma_dev", "momentum_5d", "bb_position"]
    proxy_stats = {}
    for col in proxy_cols:
        mean, std = _rolling_mean_std(df[col])
        proxy_stats[col] = {
            "mean": mean.to_dict(),
            "std": std.to_dict(),
        }

    # Skip warmup — only backtest on rows after WARMUP_DAYS
    backtest_df = df.iloc[WARMUP_DAYS:].copy()
    spy_backtest = spy_df.iloc[WARMUP_DAYS:].copy() if len(spy_df) > WARMUP_DAYS else spy_df

    equity_curve, signals, trades = _simulate(backtest_df, proxy_stats)
    equity_curve = _fill_spy(equity_curve, spy_backtest)
    stats = _compute_stats(equity_curve, trades)

    start_date = backtest_df.index[0].strftime("%Y-%m-%d") if len(backtest_df) > 0 else ""
    end_date = backtest_df.index[-1].strftime("%Y-%m-%d") if len(backtest_df) > 0 else ""

    return {
        "ticker": ticker,
        "period": period,
        "start_date": start_date,
        "end_date": end_date,
        "equity_curve": equity_curve,
        "signals": signals,
        "stats": stats,
        "trades": trades,
    }
```

- [ ] **Step 4: Run tests — all should pass**

```bash
cd D:/clearsignal/backend
source ../.venv/Scripts/activate
python -m pytest tests/test_backtest_engine.py -v
```

Expected: 5 passed (note: `test_run_backtest_schema` and equity tests make a real yfinance call — they may take ~5s)

- [ ] **Step 5: Commit**

```bash
git add backend/agents/backtest_engine.py backend/tests/test_backtest_engine.py
git commit -m "feat: backtest engine — signal proxies + simulation core"
```

---

### Task 2: Backtest API Route

**Files:**
- Modify: `backend/app/routes.py` (add import + endpoint at end of file)

**Interfaces:**
- Consumes: `run_backtest(ticker: str, period: str) -> dict` from `agents.backtest_engine`
- Produces: `GET /backtest?ticker=NVDA&period=2y` → JSON matching run_backtest response schema

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/test_backtest_engine.py`:

```python
from fastapi.testclient import TestClient
from app.main import app

def test_backtest_route_returns_200():
    client = TestClient(app)
    response = client.get("/backtest?ticker=AAPL&period=1y")
    assert response.status_code == 200
    data = response.json()
    assert data["ticker"] == "AAPL"
    assert "equity_curve" in data
    assert "stats" in data

def test_backtest_route_default_period():
    client = TestClient(app)
    response = client.get("/backtest?ticker=MSFT")
    assert response.status_code == 200
    assert response.json()["period"] == "2y"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd D:/clearsignal/backend
source ../.venv/Scripts/activate
python -m pytest tests/test_backtest_engine.py::test_backtest_route_returns_200 -v
```

Expected: FAIL — 404 Not Found (route doesn't exist yet)

- [ ] **Step 3: Add import and route to routes.py**

At the top of `backend/app/routes.py`, add to the existing imports block:

```python
from agents.backtest_engine import run_backtest as _run_backtest
```

At the end of `backend/app/routes.py`, add:

```python
@router.get("/backtest")
async def backtest_ticker(ticker: str, period: str = "2y"):
    """Run historical backtest for a ticker using price-derived signal proxies."""
    import asyncio
    ticker = ticker.upper()
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, _run_backtest, ticker, period)
    return data
```

- [ ] **Step 4: Run tests — should pass**

```bash
cd D:/clearsignal/backend
source ../.venv/Scripts/activate
python -m pytest tests/test_backtest_engine.py -v
```

Expected: all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add backend/app/routes.py backend/tests/test_backtest_engine.py
git commit -m "feat: add /backtest API route"
```

---

### Task 3: Backtest Frontend Page

**Files:**
- Create: `frontend/src/pages/Backtest.tsx`
- Modify: `frontend/src/App.tsx` (add import + route)
- Modify: `frontend/src/components/Navbar.tsx` (add Backtest nav link)

**Interfaces:**
- Consumes: `GET /api/backtest?ticker=NVDA&period=2y` (proxied by Vite to backend)
- Produces: `/backtest` route rendering 3-zone visualisation

- [ ] **Step 1: Add route to App.tsx**

In `frontend/src/App.tsx`, add import after the existing page imports:

```tsx
import Backtest from './pages/Backtest'
```

Add route inside the `<Routes>` block after the decisions route:

```tsx
<Route path="/backtest" element={<AnimatedPage><Backtest /></AnimatedPage>} />
```

- [ ] **Step 2: Add Backtest link to Navbar.tsx**

In `frontend/src/components/Navbar.tsx`, the links array currently reads:

```tsx
const links = [
  { to: '/research', label: 'Research', icon: Microscope },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/decisions', label: 'Decisions', icon: BookOpen },
]
```

Add the ChartLine import and Backtest link:

```tsx
import { Microscope, Wallet, BookOpen, ChartLine } from 'lucide-react'

const links = [
  { to: '/research', label: 'Research', icon: Microscope },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/decisions', label: 'Decisions', icon: BookOpen },
  { to: '/backtest', label: 'Backtest', icon: ChartLine },
]
```

- [ ] **Step 3: Create Backtest.tsx**

Create `frontend/src/pages/Backtest.tsx`:

```tsx
import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, ReferenceLine, Legend,
} from 'recharts'
import { ChartLine, TrendingUp, TrendingDown, Activity, Target, BarChart2 } from 'lucide-react'

interface EquityPoint { date: string; clearsignal: number; buy_hold: number; spy: number }
interface Signal { date: string; verdict: string; price: number; action: string; pnl_pct?: number }
interface Trade { entry_date: string; entry_price: number; exit_date: string; exit_price: number; pnl_pct: number; verdict_entry: string }
interface Stats {
  total_return_pct: number; buy_hold_return_pct: number; spy_return_pct: number
  alpha_vs_spy: number; max_drawdown_pct: number; sharpe_ratio: number
  win_rate_pct: number; total_trades: number
}
interface BacktestResult {
  ticker: string; period: string; start_date: string; end_date: string
  equity_curve: EquityPoint[]; signals: Signal[]; stats: Stats; trades: Trade[]
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  const color = positive === undefined ? 'text-text-primary' : positive ? 'text-bullish' : 'text-bearish'
  return (
    <div className="glass-card p-4 flex flex-col gap-1">
      <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
      {sub && <span className="text-xs text-text-muted">{sub}</span>}
    </div>
  )
}

function ShimmerZone({ height = 'h-64' }: { height?: string }) {
  return <div className={`glass-card ${height} shimmer`} />
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-xs space-y-1">
      <p className="text-text-muted font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: ${p.value?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  )
}

export default function Backtest() {
  const [ticker, setTicker] = useState('NVDA')
  const [period, setPeriod] = useState<'1y' | '2y'>('2y')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)

  async function runBacktest() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/backtest?ticker=${ticker.toUpperCase()}&period=${period}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data: BacktestResult = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const signalDates = new Set(result?.signals.map(s => s.date) ?? [])
  const signalByDate = Object.fromEntries(result?.signals.map(s => [s.date, s]) ?? [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ChartLine className="w-5 h-5 text-accent" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Backtest</h1>
          <p className="text-xs text-text-muted">Replay ClearSignal's signal engine over historical data</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <input
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && runBacktest()}
          placeholder="Ticker (e.g. NVDA)"
          className="min-w-0 flex-1 max-w-xs bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
        />
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {(['1y', '2y'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${period === p ? 'bg-accent text-bg-deep' : 'text-text-muted hover:text-text-primary'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={runBacktest}
          disabled={loading}
          className="px-4 py-2 bg-accent text-bg-deep rounded-lg text-sm font-semibold hover:bg-accent-light transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Backtest'}
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 border-bearish/30 text-bearish text-sm">{error}</div>
      )}

      {/* Zone 1 — Equity Curve */}
      {loading ? <ShimmerZone height="h-72" /> : result && (
        <div className="glass-card p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Equity Curve</h2>
          <p className="text-xs text-text-muted mb-4">
            {result.start_date} → {result.end_date} · Starting capital $10,000
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={result.equity_curve} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="csGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bhGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false}
                interval={Math.floor(result.equity_curve.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="clearsignal" name="ClearSignal" stroke="#10b981" strokeWidth={2}
                fill="url(#csGrad)" dot={false} isAnimationActive animationDuration={1200} />
              <Area type="monotone" dataKey="buy_hold" name={`${result.ticker} Buy & Hold`} stroke="#a1a1aa"
                strokeWidth={1.5} fill="url(#bhGrad)" dot={false} isAnimationActive animationDuration={1200} />
              <Area type="monotone" dataKey="spy" name="S&P 500 (SPY)" stroke="#f59e0b"
                strokeWidth={1.5} fill="url(#spyGrad)" dot={false} isAnimationActive animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Zone 2 — Price + Signal Markers */}
      {loading ? <ShimmerZone height="h-64" /> : result && (
        <div className="glass-card p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Price Chart + Signals</h2>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={result.equity_curve.map((pt, i) => ({
              ...pt,
              price: result.equity_curve[i].buy_hold / (result.equity_curve[0].buy_hold / 100),
            }))} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false}
                interval={Math.floor(result.equity_curve.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: '#52525b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="buy_hold" name={`${result.ticker} Price`} stroke="#a1a1aa"
                strokeWidth={1.5} dot={false} isAnimationActive={false} />
              {result.signals.filter(s => s.action === 'enter').map(s => (
                <ReferenceLine key={`buy-${s.date}`} x={s.date} stroke="#10b981" strokeDasharray="3 3"
                  label={{ value: '▲', position: 'top', fill: '#10b981', fontSize: 10 }} />
              ))}
              {result.signals.filter(s => s.action === 'exit').map(s => (
                <ReferenceLine key={`sell-${s.date}`} x={s.date} stroke="#ef4444" strokeDasharray="3 3"
                  label={{ value: '▼', position: 'top', fill: '#ef4444', fontSize: 10 }} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1"><span className="text-bullish">▲</span> BUY signal</span>
            <span className="flex items-center gap-1"><span className="text-bearish">▼</span> SELL signal</span>
          </div>
        </div>
      )}

      {/* Zone 3 — Stats + Trade Log */}
      {loading ? <ShimmerZone height="h-48" /> : result && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Total Return" value={`${result.stats.total_return_pct > 0 ? '+' : ''}${result.stats.total_return_pct}%`}
              sub={`vs ${result.stats.buy_hold_return_pct}% buy & hold`} positive={result.stats.total_return_pct > result.stats.buy_hold_return_pct} />
            <StatCard label="Alpha vs S&P" value={`${result.stats.alpha_vs_spy > 0 ? '+' : ''}${result.stats.alpha_vs_spy}%`}
              positive={result.stats.alpha_vs_spy > 0} />
            <StatCard label="Max Drawdown" value={`${result.stats.max_drawdown_pct}%`}
              positive={result.stats.max_drawdown_pct > -15} />
            <StatCard label="Sharpe Ratio" value={`${result.stats.sharpe_ratio}`}
              sub="annualised" positive={result.stats.sharpe_ratio > 1} />
            <StatCard label="Win Rate" value={`${result.stats.win_rate_pct}%`}
              sub={`${result.stats.total_trades} trades`} positive={result.stats.win_rate_pct > 50} />
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Trade Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border">
                    <th className="px-4 py-2 text-left font-medium">Entry</th>
                    <th className="px-4 py-2 text-right font-medium">Entry $</th>
                    <th className="px-4 py-2 text-left font-medium">Exit</th>
                    <th className="px-4 py-2 text-right font-medium">Exit $</th>
                    <th className="px-4 py-2 text-right font-medium">P&L</th>
                    <th className="px-4 py-2 text-left font-medium">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {result.trades.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">No completed trades</td></tr>
                  )}
                  {result.trades.map((t, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-2 font-mono text-text-secondary">{t.entry_date}</td>
                      <td className="px-4 py-2 font-mono text-right text-text-primary">${t.entry_price}</td>
                      <td className="px-4 py-2 font-mono text-text-secondary">{t.exit_date}</td>
                      <td className="px-4 py-2 font-mono text-right text-text-primary">${t.exit_price}</td>
                      <td className={`px-4 py-2 font-mono text-right font-semibold ${t.pnl_pct >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                        {t.pnl_pct > 0 ? '+' : ''}{t.pnl_pct}%
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${t.verdict_entry === 'STRONG_BUY' ? 'bg-bullish/20 text-bullish' : 'bg-accent/10 text-accent'}`}>
                          {t.verdict_entry}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <div className="glass-card p-12 flex flex-col items-center gap-3 text-center">
          <Activity className="w-8 h-8 text-text-muted" />
          <p className="text-text-secondary text-sm">Enter a ticker and run the backtest to see results</p>
          <p className="text-text-muted text-xs">Uses 2 years of daily OHLCV data · Same signal engine as live research</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify frontend compiles**

```bash
cd D:/clearsignal/frontend
npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors, build succeeds

- [ ] **Step 5: Smoke-test in browser**

Start backend + frontend. Navigate to `http://localhost:5173/backtest` (or whichever port Vite picks).

1. Verify "Backtest" link appears in the navbar
2. Type `NVDA`, click **Run Backtest**
3. Verify shimmer shows during load (~5–10s)
4. Verify 3 zones render: equity curve (3 lines), price chart with markers, stats cards + trade log

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Backtest.tsx frontend/src/App.tsx frontend/src/components/Navbar.tsx
git commit -m "feat: backtest frontend — equity curve, signal markers, stats, trade log"
```

---

### Task 4: Push to GitHub

**Files:** none (git push only)

- [ ] **Step 1: Run all backend tests**

```bash
cd D:/clearsignal/backend
source ../.venv/Scripts/activate
python -m pytest tests/ -v --tb=short
```

Expected: all tests pass (including the 5 new backtest tests)

- [ ] **Step 2: Push**

```bash
cd D:/clearsignal
git push "https://Dennis0424:[REDACTED]@github.com/Dennis0424/clearsignal.git" master
```

Expected: `master -> master`
