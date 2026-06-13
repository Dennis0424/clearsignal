import yfinance as yf


def get_price_history(ticker: str, period: str = "3mo", interval: str = "1d") -> list[dict]:
    """Fetch historical price data for sparkline/chart display."""
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period, interval=interval)

    if hist.empty:
        return []

    data = []
    for date, row in hist.iterrows():
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": float(round(row["Open"], 2)),
            "high": float(round(row["High"], 2)),
            "low": float(round(row["Low"], 2)),
            "close": float(round(row["Close"], 2)),
            "volume": int(row["Volume"]),
        })
    return data


def get_analyst_data(ticker: str) -> dict:
    """Fetch analyst ratings and target prices."""
    stock = yf.Ticker(ticker)
    info = stock.info or {}

    return {
        "ticker": ticker,
        "recommendation": info.get("recommendationKey"),
        "target_high": info.get("targetHighPrice"),
        "target_low": info.get("targetLowPrice"),
        "target_mean": info.get("targetMeanPrice"),
        "target_median": info.get("targetMedianPrice"),
        "num_analysts": info.get("numberOfAnalystOpinions"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
    }
