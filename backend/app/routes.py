import json
from fastapi import APIRouter
from app.schemas import AnalyzeRequest, AnalyzeResponse, ModuleScoreResponse, CompareResponse
from app.database import Database
from app.bitget_client import fetch_all_signals
from app.explainer import generate_explanation
from app.llm_client import get_llm_client
from signal_engine.engine import analyze

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
