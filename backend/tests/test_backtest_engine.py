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
