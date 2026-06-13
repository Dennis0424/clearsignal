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
from agents.trader import get_ticker_price, place_spot_order, preview_trade
from agents.chart_data import get_price_history, get_analyst_data
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

    loop = asyncio.get_event_loop()
    financials, social = await asyncio.gather(
        loop.run_in_executor(None, get_financials, ticker),
        loop.run_in_executor(None, get_social_pulse, ticker),
    )

    context = format_financials_for_prompt(financials) + "\n\n" + format_social_for_prompt(social)
    debate_result = await run_debate(ticker, context)

    return {
        "ticker": ticker,
        "financials": financials,
        "social": social,
        "debate": debate_result,
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
    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(None, get_price_history, ticker, period)
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


@router.post("/decision")
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


@router.get("/decisions")
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
