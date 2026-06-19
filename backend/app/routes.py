import json
from fastapi import APIRouter
from app.schemas import AnalyzeRequest, AnalyzeResponse, ModuleScoreResponse, CompareResponse, TradeRequest
from app.database import Database
from app.bitget_client import fetch_all_signals
from app.explainer import generate_explanation
from app.llm_client import get_llm_client
from signal_engine.engine import analyze
from agents.financials import get_financials, format_financials_for_prompt
from agents.social_pulse import get_social_pulse, format_social_for_prompt
from agents.debate import run_debate
from agents.trader import get_ticker_price, place_spot_order, preview_trade, get_account_assets
from agents.chart_data import get_price_history, get_analyst_data
from agents.stock_intel import get_earnings_calendar, get_insider_transactions, get_whatif_simulation, get_portfolio_correlation
from agents.ticker_utils import asset_info, yfinance_symbol, is_crypto
from agents.chat import chat_about_stock
from agents.fomo_detector import check_fomo_signals, regret_simulation, generate_fomo_warning

router = APIRouter()
db = Database("trades.db")
db.create_tables()

COMPARISON_PROMPT = """Should I buy, hold, or sell {ticker} right now? Give me a one-paragraph answer with your reasoning. Be direct — BUY, HOLD, or SELL."""


async def get_llm_comparison(ticker: str) -> str | None:
    try:
        client = get_llm_client()
        return await client.complete(COMPARISON_PROMPT.format(ticker=ticker))
    except Exception:
        return None


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_ticker(request: AnalyzeRequest):
    signals = await fetch_all_signals(request.ticker)
    verdict = analyze(signals)

    scores_response = [
        ModuleScoreResponse(
            module_name=s.module_name,
            z_score=s.z_score,
            vote=s.vote,
        )
        for s in verdict.scores
    ]

    explanation = await generate_explanation(request.ticker, verdict)

    scores_json = json.dumps([s.model_dump() for s in scores_response])
    db.log_trade(
        ticker=request.ticker,
        verdict=verdict.verdict_type.value,
        confluence_count=verdict.confluence_count,
        total_modules=verdict.total_modules,
        shock_detected=verdict.shock_detected,
        scores_json=scores_json,
    )

    return AnalyzeResponse(
        ticker=request.ticker,
        verdict=verdict.verdict_type.value,
        confluence_count=verdict.confluence_count,
        total_modules=verdict.total_modules,
        shock_detected=verdict.shock_detected,
        scores=scores_response,
        explanation=explanation,
    )


@router.post("/compare", response_model=CompareResponse)
async def compare_ticker(request: AnalyzeRequest):
    signals = await fetch_all_signals(request.ticker)
    verdict = analyze(signals)
    explanation = await generate_explanation(request.ticker, verdict)
    llm_answer = await get_llm_comparison(request.ticker)

    return CompareResponse(
        ticker=request.ticker,
        clearsignal_verdict=verdict.verdict_type.value,
        clearsignal_confluence=verdict.confluence_count,
        clearsignal_explanation=explanation,
        llm_raw_answer=llm_answer,
    )


@router.get("/history")
async def get_history(ticker: str | None = None):
    return db.get_history(ticker=ticker)


@router.get("/research/{ticker}")
async def research_ticker(ticker: str):
    """Run Financials + Social Pulse agents and return combined data."""
    ticker = ticker.upper()
    financials = get_financials(ticker)
    social = get_social_pulse(ticker)
    return {
        "ticker": ticker,
        "financials": financials,
        "social": social,
    }


@router.post("/debate/{ticker}")
async def debate_ticker(ticker: str):
    """Run full pipeline: research (parallel) + Bull/Bear/Judge debate."""
    import asyncio
    ticker = ticker.upper()
    yf_symbol = yfinance_symbol(ticker)

    loop = asyncio.get_event_loop()
    financials, social = await asyncio.gather(
        loop.run_in_executor(None, get_financials, yf_symbol),
        loop.run_in_executor(None, get_social_pulse, yf_symbol),
    )

    context = format_financials_for_prompt(financials) + "\n\n" + format_social_for_prompt(social)
    debate_result = await run_debate(ticker, context)

    return {
        "ticker": ticker,
        "financials": financials,
        "social": social,
        "debate": debate_result,
        "asset": asset_info(ticker),
    }


@router.get("/price/{symbol}")
async def get_price(symbol: str):
    """Get real-time price for a trading pair."""
    return get_ticker_price(symbol.upper())


@router.post("/trade")
async def execute_trade(request: TradeRequest):
    """Execute or preview a spot trade."""
    if request.dry_run:
        return preview_trade(
            symbol=request.symbol,
            side=request.side,
            quantity=request.quantity,
            price=request.price,
        )
    return place_spot_order(
        symbol=request.symbol,
        side=request.side,
        quantity=request.quantity,
        price=request.price,
    )


@router.get("/chart/{ticker}")
async def get_chart_data(ticker: str, period: str = "3mo"):
    """Get historical price data for charting."""
    import asyncio
    ticker = ticker.upper()
    yf_sym = yfinance_symbol(ticker)
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_price_history, yf_sym, period)
    return {"ticker": ticker, "period": period, "data": data}


@router.get("/analysts/{ticker}")
async def get_analysts(ticker: str):
    """Get analyst ratings and price targets."""
    import asyncio
    ticker = ticker.upper()
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_analyst_data, ticker)
    return data


@router.post("/chat/{ticker}")
async def chat_endpoint(ticker: str, body: dict):
    """AI chat — ask any question about a stock."""
    ticker = ticker.upper()
    question = body.get("question", "")
    if not question:
        return {"error": "No question provided"}
    answer = await chat_about_stock(ticker, question)
    return {"ticker": ticker, "question": question, "answer": answer}


@router.post("/fomo-check/{ticker}")
async def fomo_check(ticker: str, body: dict):
    """Run FOMO detection + regret simulation."""
    import asyncio
    ticker = ticker.upper()
    quantity = body.get("quantity", 1)
    loop = asyncio.get_event_loop()
    fomo_data = await loop.run_in_executor(None, check_fomo_signals, ticker, db)
    regret = regret_simulation(fomo_data["current_price"], quantity)
    warning = await generate_fomo_warning(ticker, fomo_data)
    return {**fomo_data, "regret": regret, "warning": warning}


@router.post("/decision-save")
async def save_decision(body: dict):
    """Save a decision journal entry and optionally execute trade."""
    import json
    ticker = body.get("ticker", "").upper()
    row_id = db.save_decision(
        ticker=ticker,
        side=body.get("side", "buy"),
        quantity=body.get("quantity", 0),
        price=body.get("price", 0),
        fomo_score=body.get("fomo_score", "LOW"),
        fomo_signals=json.dumps(body.get("fomo_signals", [])),
        reasoning=body.get("reasoning", ""),
        confidence=body.get("confidence", 5),
        time_horizon=body.get("time_horizon", "1w"),
    )
    return {"id": row_id, "message": "Decision recorded"}


@router.get("/decision-log")
async def get_decisions():
    """Get all past decisions."""
    return db.get_decisions()


@router.get("/autopsy")
async def get_autopsy():
    """Get autopsy stats + LLM pattern analysis."""
    stats = db.get_autopsy_stats()
    if stats["total_trades"] == 0:
        return {**stats, "insight": "No trades recorded yet. Start trading to build your autopsy report."}

    if stats["total_trades"] >= 3:
        decisions = db.get_decisions(limit=20)
        decisions_text = "\n".join(
            f"- {d['ticker']} ({d['side']}): confidence {d['confidence']}/10, "
            f"FOMO={d['fomo_score']}, reason: {d['reasoning']}"
            for d in decisions
        )
        prompt = f"""Analyze this trader's decision history and find ONE actionable pattern.
Be specific. Reference their actual trades. Max 2 sentences.

Trades:
{decisions_text}

Stats: {stats['total_trades']} total, {stats['fomo_trades']} FOMO trades, avg confidence {stats['avg_confidence']}"""
        try:
            llm = get_llm_client()
            insight = await llm.complete(prompt)
        except Exception:
            insight = None
    else:
        insight = None

    return {**stats, "insight": insight}


@router.get("/portfolio/assets")
async def get_portfolio_assets():
    """Get spot account assets from Bitget."""
    import asyncio
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_account_assets)
    return data


@router.get("/cooldown")
async def get_cooldown():
    """Return whether a cooldown is active based on the trader's last losing trade."""
    from datetime import datetime, timezone

    decisions = db.get_decisions(limit=10)

    last_loss = None
    for d in decisions:
        if d["outcome_pct"] is not None and d["outcome_pct"] < 0:
            last_loss = d
            break

    if last_loss is None:
        return {
            "active": False,
            "seconds_remaining": 0,
            "minutes_remaining": 0.0,
            "last_loss_pct": None,
            "last_loss_ticker": None,
            "message": "All clear. But are you sure?",
        }

    loss_pct = abs(last_loss["outcome_pct"])
    cooldown_duration = min(loss_pct * 30 * 60, 14400)

    now = datetime.now(timezone.utc)
    ts = datetime.fromisoformat(last_loss["created_at"].replace("Z", "+00:00"))
    elapsed = (now - ts).total_seconds()
    seconds_remaining = max(0, cooldown_duration - elapsed)

    if seconds_remaining <= 0:
        return {
            "active": False,
            "seconds_remaining": 0,
            "minutes_remaining": 0.0,
            "last_loss_pct": last_loss["outcome_pct"],
            "last_loss_ticker": last_loss["ticker"],
            "message": "All clear. But are you sure?",
        }

    if loss_pct < 5:
        message = "Small cut. Still, let it breathe."
    elif loss_pct < 15:
        message = "That one stung. Step away from the keyboard."
    else:
        message = "Put the phone down. Walk outside. Touch grass."

    return {
        "active": True,
        "seconds_remaining": int(seconds_remaining),
        "minutes_remaining": round(seconds_remaining / 60, 1),
        "last_loss_pct": last_loss["outcome_pct"],
        "last_loss_ticker": last_loss["ticker"],
        "message": message,
    }


@router.get("/roast")
async def get_roast():
    """Claude roasts the trader's decision journal."""
    decisions = db.get_decisions(limit=15)

    if len(decisions) < 2:
        return {"roast": "You haven't traded enough to be roasted yet. Give the market more chances to humble you."}

    decisions_text = "\n".join(
        f"- {d['ticker']} ({d['side']}): confidence {d['confidence']}/10, "
        f"FOMO={d['fomo_score']}, outcome="
        + (f"{d['outcome_pct']:+.1f}%" if d["outcome_pct"] is not None else "pending")
        + f", reasoning: \"{d['reasoning']}\""
        for d in decisions
    )

    prompt = f"""You are a brutally honest trading coach who roasts traders' decisions like a stand-up comedian.
Roast this trader's decision history in 2-3 sentences. Be specific — reference their actual tickers and reasoning.
Be funny but accurate. No emojis. Point out the exact mistake pattern you see.

Their trades:
{decisions_text}

Give the roast only. No intro, no "here's your roast". Just the roast itself."""

    try:
        llm = get_llm_client()
        roast = await llm.complete(prompt)
    except Exception:
        roast = "The market already roasted you enough. My work here is done."

    return {"roast": roast}


@router.get("/degen-score")
async def get_degen_score():
    """Calculates a 0-100 degen score based on trading behavior."""
    from datetime import datetime, timezone

    decisions = db.get_decisions(limit=20)

    if not decisions:
        return {"score": 0, "level": "zen", "factors": [], "message": "No trades yet. Pure potential."}

    score = 0
    factors = []

    # Factor 1: FOMO trade ratio (max 35 points)
    fomo_count = sum(1 for d in decisions if d["fomo_score"] in ("HIGH", "MODERATE"))
    fomo_ratio = fomo_count / len(decisions)
    fomo_points = int(fomo_ratio * 35)
    score += fomo_points
    if fomo_points > 0:
        factors.append({"label": "FOMO trades", "value": f"{int(fomo_ratio * 100)}%", "points": fomo_points})

    # Factor 2: Overconfidence (avg confidence > 8, max 25 points)
    avg_conf = sum(d["confidence"] for d in decisions) / len(decisions)
    if avg_conf >= 9:
        conf_points = 25
    elif avg_conf >= 8:
        conf_points = 15
    elif avg_conf >= 7:
        conf_points = 5
    else:
        conf_points = 0
    score += conf_points
    if conf_points > 0:
        factors.append({"label": "Overconfidence", "value": f"{avg_conf:.1f}/10 avg", "points": conf_points})

    # Factor 3: Consecutive losses (max 25 points)
    resolved = [d for d in decisions if d["outcome_pct"] is not None]
    if resolved:
        streak = 0
        for d in resolved:
            if d["outcome_pct"] < 0:
                streak += 1
            else:
                break
        if streak >= 3:
            streak_points = 25
        elif streak == 2:
            streak_points = 15
        elif streak == 1:
            streak_points = 8
        else:
            streak_points = 0
        score += streak_points
        if streak_points > 0:
            factors.append({"label": "Loss streak", "value": f"{streak} in a row", "points": streak_points})

    # Factor 4: Trading frequency (many trades in short time, max 15 points)
    if len(decisions) >= 5:
        now = datetime.now(timezone.utc)
        recent = 0
        for d in decisions[:10]:
            try:
                ts = datetime.fromisoformat(d["created_at"].replace("Z", "+00:00"))
                if (now - ts).total_seconds() < 86400:
                    recent += 1
            except Exception:
                pass
        if recent >= 7:
            freq_points = 15
        elif recent >= 5:
            freq_points = 10
        elif recent >= 3:
            freq_points = 5
        else:
            freq_points = 0
        score += freq_points
        if freq_points > 0:
            factors.append({"label": "Overtrading", "value": f"{recent} trades today", "points": freq_points})

    score = min(score, 100)

    if score >= 70:
        level = "degen"
        message = "You are not trading. You are gambling with extra steps."
    elif score >= 40:
        level = "spicy"
        message = "Elevated risk behavior detected. The market is watching."
    else:
        level = "zen"
        message = "Disciplined. Suspicious, even."

    return {"score": score, "level": level, "factors": factors, "message": message}


@router.get("/earnings/{ticker}")
async def get_earnings(ticker: str):
    """Get upcoming earnings date and recent earnings history."""
    import asyncio
    ticker = ticker.upper()
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_earnings_calendar, ticker)
    return data


@router.get("/insiders/{ticker}")
async def get_insiders(ticker: str):
    """Get recent insider transactions (SEC Form 4 data)."""
    import asyncio
    ticker = ticker.upper()
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_insider_transactions, ticker)
    return data


@router.get("/whatif")
async def whatif_simulation(ticker: str, amount: float = 1000, days_ago: int = 30):
    """What-if time machine: simulate past investment returns."""
    import asyncio
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_whatif_simulation, ticker, amount, days_ago)
    return data


@router.get("/correlation")
async def portfolio_correlation(tickers: str):
    """Calculate correlation matrix between tickers (comma-separated)."""
    import asyncio
    ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
    if len(ticker_list) < 2:
        return {"error": "Need at least 2 tickers"}
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_portfolio_correlation, ticker_list)
    return data
