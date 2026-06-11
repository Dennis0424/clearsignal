from signal_engine.models import ModuleScore, Verdict, VerdictType

SHOCK_MODULES = {"macro-analyst", "news-briefing"}
SHOCK_THRESHOLD = -2.0


def vote(scores: list[ModuleScore]) -> Verdict:
    bullish_count = sum(1 for s in scores if s.vote == "bullish")
    bearish_count = sum(1 for s in scores if s.vote == "bearish")

    if bullish_count == 5:
        verdict_type = VerdictType.STRONG_BUY
        confluence = 5
    elif bullish_count >= 4:
        verdict_type = VerdictType.BUY
        confluence = bullish_count
    elif bearish_count == 5:
        verdict_type = VerdictType.STRONG_SELL
        confluence = 5
    elif bearish_count >= 4:
        verdict_type = VerdictType.SELL
        confluence = bearish_count
    else:
        verdict_type = VerdictType.HOLD
        confluence = max(bullish_count, bearish_count)

    shock_detected = any(
        s.z_score <= SHOCK_THRESHOLD
        for s in scores
        if s.module_name in SHOCK_MODULES
    )

    return Verdict(
        verdict_type=verdict_type,
        confluence_count=confluence,
        total_modules=len(scores),
        scores=scores,
        shock_detected=shock_detected,
    )
