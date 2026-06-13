import yfinance as yf
from app.llm_client import get_llm_client
from app.database import Database


def check_fomo_signals(ticker: str, db: Database | None = None) -> dict:
    """Check 4 FOMO signals for a ticker. Returns risk score + triggered signals."""
    stock = yf.Ticker(ticker)
    info = stock.info or {}
    signals = []

    current_price = info.get("currentPrice") or info.get("regularMarketPrice") or 0
    prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose") or 0
    high_52w = info.get("fiftyTwoWeekHigh") or 0

    # Signal 1: Price spike (>5% in last session)
    if prev_close and current_price:
        change_pct = ((current_price - prev_close) / prev_close) * 100
        if change_pct > 5:
            signals.append({
                "signal": "price_spike",
                "message": f"Price is up {change_pct:.1f}% since last close",
                "severity": "high" if change_pct > 10 else "moderate",
            })

    # Signal 2: Near 52-week high (within 5%)
    if high_52w and current_price:
        pct_from_high = ((high_52w - current_price) / high_52w) * 100
        if pct_from_high < 5:
            signals.append({
                "signal": "near_52w_high",
                "message": f"Trading within {pct_from_high:.1f}% of 52-week high (${high_52w:.2f})",
                "severity": "moderate",
            })

    # Signal 3: Social hype (use news count as proxy)
    news = stock.news or []
    if len(news) > 6:
        signals.append({
            "signal": "social_hype",
            "message": f"High media activity: {len(news)} recent articles (above average)",
            "severity": "moderate" if len(news) < 10 else "high",
        })

    # Signal 4: Trade frequency (check DB if available)
    if db:
        recent = db.get_recent_decision_count(ticker, hours=24)
        if recent >= 3:
            signals.append({
                "signal": "tilt",
                "message": f"You've already made {recent} trades in the last 24h — possible tilt",
                "severity": "high",
            })

    # Calculate overall risk level
    high_count = sum(1 for s in signals if s["severity"] == "high")
    if high_count >= 2 or len(signals) >= 3:
        risk_level = "HIGH"
    elif len(signals) >= 1:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    return {
        "ticker": ticker,
        "current_price": current_price,
        "risk_level": risk_level,
        "signals": signals,
        "signal_count": len(signals),
    }


def regret_simulation(price: float, quantity: float) -> dict:
    """Calculate potential losses at various drawdown levels."""
    position_value = price * quantity
    scenarios = [
        {"drawdown_pct": 10, "loss": round(position_value * 0.10, 2)},
        {"drawdown_pct": 20, "loss": round(position_value * 0.20, 2)},
        {"drawdown_pct": 50, "loss": round(position_value * 0.50, 2)},
    ]
    return {
        "position_value": round(position_value, 2),
        "scenarios": scenarios,
    }


async def generate_fomo_warning(ticker: str, fomo_data: dict) -> str:
    """Generate a personalized warning message using LLM."""
    if fomo_data["risk_level"] == "LOW":
        return "No significant FOMO signals detected. Trade looks deliberate."

    signals_text = "\n".join(f"- {s['message']}" for s in fomo_data["signals"])
    prompt = f"""You are a behavioral finance advisor. A trader wants to buy {ticker}.
These FOMO warning signals triggered:
{signals_text}

Risk level: {fomo_data['risk_level']}

Write a SHORT (2 sentences max), data-backed warning. Be direct but not judgmental.
Don't say "be careful" — state the statistical reality of buying in this condition."""

    llm = get_llm_client()
    return await llm.complete(prompt)
