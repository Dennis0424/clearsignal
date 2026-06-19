import math
import yfinance as yf
from curl_cffi.requests import Session as CurlSession


def _safe_float(val, default=None):
    try:
        f = float(val)
        return default if math.isnan(f) else f
    except (TypeError, ValueError):
        return default


def get_earnings_calendar(ticker: str) -> dict:
    """Get upcoming earnings date and recent earnings history from yfinance."""
    session = CurlSession(impersonate="chrome")
    stock = yf.Ticker(ticker, session=session)

    result = {
        "ticker": ticker,
        "next_earnings": None,
        "earnings_history": [],
    }

    try:
        cal = stock.calendar
        if cal is not None and not (hasattr(cal, 'empty') and cal.empty):
            if isinstance(cal, dict):
                earnings_date = cal.get("Earnings Date")
                if earnings_date:
                    if isinstance(earnings_date, list) and len(earnings_date) > 0:
                        result["next_earnings"] = str(earnings_date[0])
                    else:
                        result["next_earnings"] = str(earnings_date)
            elif hasattr(cal, 'iloc'):
                if "Earnings Date" in cal.index:
                    val = cal.loc["Earnings Date"]
                    if hasattr(val, 'iloc'):
                        result["next_earnings"] = str(val.iloc[0])
                    else:
                        result["next_earnings"] = str(val)
    except Exception:
        pass

    try:
        earnings = stock.earnings_dates
        if earnings is not None and not earnings.empty:
            for date, row in earnings.head(4).iterrows():
                result["earnings_history"].append({
                    "date": str(date.date()) if hasattr(date, 'date') else str(date),
                    "eps_estimate": _safe_float(row.get("EPS Estimate")),
                    "eps_actual": _safe_float(row.get("Reported EPS")),
                    "surprise_pct": _safe_float(row.get("Surprise(%)")),
                })
    except Exception:
        pass

    return result


def get_insider_transactions(ticker: str) -> dict:
    """Get recent insider buy/sell transactions from yfinance (SEC Form 4)."""
    session = CurlSession(impersonate="chrome")
    stock = yf.Ticker(ticker, session=session)

    result = {
        "ticker": ticker,
        "transactions": [],
        "summary": {"buys": 0, "sells": 0, "net_signal": "neutral"},
    }

    try:
        insiders = stock.insider_transactions
        if insiders is not None and not insiders.empty:
            buys = 0
            sells = 0
            for _, row in insiders.head(10).iterrows():
                tx_type = str(row.get("Text", ""))
                shares = int(_safe_float(row.get("Shares"), 0))
                value = _safe_float(row.get("Value"), 0)

                is_buy = "Purchase" in tx_type or "Buy" in tx_type
                is_sell = "Sale" in tx_type or "Sell" in tx_type

                if is_buy:
                    buys += 1
                elif is_sell:
                    sells += 1

                start_date = row.get("Start Date", "")
                result["transactions"].append({
                    "date": str(start_date)[:10] if start_date else "",
                    "insider": str(row.get("Insider", "Unknown")),
                    "type": "buy" if is_buy else "sell" if is_sell else "other",
                    "shares": shares,
                    "value": value,
                    "text": tx_type[:60],
                })

            result["summary"]["buys"] = buys
            result["summary"]["sells"] = sells
            if buys > sells + 1:
                result["summary"]["net_signal"] = "bullish"
            elif sells > buys + 1:
                result["summary"]["net_signal"] = "bearish"
            else:
                result["summary"]["net_signal"] = "neutral"
    except Exception:
        pass

    return result
