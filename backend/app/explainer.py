from signal_engine.models import Verdict
from app.llm_client import get_llm_client

PROMPT_TEMPLATE = """You are ClearSignal, a deterministic stock signal engine. Explain the following signal analysis in plain English for a retail trader. Be concise (3-4 sentences max).

Ticker: {ticker}
Verdict: {verdict} ({confluence}/{total} signals agree)
{shock_line}
Module scores:
{scores_block}

Rules:
- Explain which modules agreed and WHY each scored the way it did
- Reference the Z-scores to justify strength
- If shock is detected, warn the trader about potential distortion
- Do NOT give financial advice or predict price movement
- Keep it factual and educational"""


def build_explanation_prompt(ticker: str, verdict: Verdict) -> str:
    scores_block = "\n".join(
        f"  - {s.module_name}: z={s.z_score:+.1f} ({s.vote})"
        for s in verdict.scores
    )
    shock_line = "WARNING: Macro/news shock detected — signal may be distorted." if verdict.shock_detected else ""

    return PROMPT_TEMPLATE.format(
        ticker=ticker,
        verdict=verdict.verdict_type.value,
        confluence=verdict.confluence_count,
        total=verdict.total_modules,
        shock_line=shock_line,
        scores_block=scores_block,
    )


async def generate_explanation(ticker: str, verdict: Verdict) -> str | None:
    try:
        client = get_llm_client()
        prompt = build_explanation_prompt(ticker, verdict)
        return await client.complete(prompt)
    except Exception:
        return None
