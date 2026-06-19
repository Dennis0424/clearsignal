"""Utility to detect asset class and map tickers for yfinance/Bitget."""

CRYPTO_TICKERS = {
    "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "DOT", "AVAX", "LINK",
    "MATIC", "UNI", "AAVE", "LTC", "BCH", "FIL", "ATOM", "NEAR",
    "APT", "ARB", "OP", "SUI", "SEI", "TIA", "JUP", "WIF", "PEPE",
    "SHIB", "BONK", "RENDER", "FET", "TAO", "INJ", "TRX", "BNB",
}

# Common stock tickers that might be confused with crypto
STOCK_OVERRIDES = {"LINK", "UNI", "NEAR", "APT", "OP"}


def is_crypto(ticker: str) -> bool:
    """Determine if a ticker is a cryptocurrency."""
    t = ticker.upper().replace("-USD", "").replace("USDT", "")
    return t in CRYPTO_TICKERS


def yfinance_symbol(ticker: str) -> str:
    """Convert ticker to yfinance-compatible symbol.
    Crypto: BTC -> BTC-USD, ETH -> ETH-USD
    Stocks: AAPL -> AAPL (unchanged)
    """
    t = ticker.upper()
    if is_crypto(t):
        base = t.replace("-USD", "").replace("USDT", "")
        return f"{base}-USD"
    return t


def bitget_symbol(ticker: str) -> str:
    """Convert ticker to Bitget spot trading pair.
    BTC -> BTCUSDT, ETH -> ETHUSDT
    Returns empty string if not crypto-tradeable.
    """
    t = ticker.upper().replace("-USD", "").replace("USDT", "")
    if t in CRYPTO_TICKERS:
        return f"{t}USDT"
    return ""


def asset_info(ticker: str) -> dict:
    """Return asset classification for frontend."""
    t = ticker.upper()
    crypto = is_crypto(t)
    return {
        "ticker": t,
        "asset_class": "crypto" if crypto else "stock",
        "tradeable": crypto,
        "bitget_symbol": bitget_symbol(t) if crypto else None,
        "yfinance_symbol": yfinance_symbol(t),
    }
