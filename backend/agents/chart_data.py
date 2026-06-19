import yfinance as yf
from curl_cffi.requests import Session as CurlSession


def get_price_history(ticker: str, period: str = "3mo", interval: str = "1d") -> list[dict]:
    """Fetch historical price data for sparkline/chart display."""
    session = CurlSession(impersonate="chrome")
    stock = yf.Ticker(ticker, session=session)
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


WATCHLIST_STOCKS = ["NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "META", "GOOGL", "AMD", "PLTR", "ARM"]
WATCHLIST_CRYPTO = ["BTC", "ETH", "SOL", "BNB", "XRP"]


def get_scanner_data() -> list[dict]:
    """Quick market scan: fetch 5d price history + change for a preset watchlist."""
    import math

    session = CurlSession(impersonate="chrome")
    results = []

    tickers_to_scan = [(t, "stock") for t in WATCHLIST_STOCKS] + [(t, "crypto") for t in WATCHLIST_CRYPTO]

    for symbol, asset_class in tickers_to_scan:
        try:
            yf_sym = f"{symbol}-USD" if asset_class == "crypto" else symbol
            stock = yf.Ticker(yf_sym, session=session)
            hist = stock.history(period="5d", interval="1d")
            if hist.empty or len(hist) < 2:
                continue
            prices = hist["Close"].tolist()
            prev_close = prices[-2]
            current = prices[-1]
            change_pct = ((current - prev_close) / prev_close) * 100 if prev_close else 0

            # 5-day sparkline (normalized)
            sparkline = [round(float(p), 2) for p in prices if not math.isnan(p)]

            results.append({
                "ticker": symbol,
                "asset_class": asset_class,
                "price": round(float(current), 2),
                "change_pct": round(change_pct, 2),
                "sparkline": sparkline,
            })
        except Exception:
            continue

    return results


def get_analyst_data(ticker: str) -> dict:
    """Fetch analyst ratings and target prices."""
    session = CurlSession(impersonate="chrome")
    stock = yf.Ticker(ticker, session=session)
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
