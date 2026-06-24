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
