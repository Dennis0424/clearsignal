from signal_engine.models import ModuleScore, VerdictType
from signal_engine.voter import vote

MODULES = [
    "technical-analysis",
    "sentiment-analyst",
    "macro-analyst",
    "news-briefing",
    "market-intel",
]


def _make_scores(votes: list[str]) -> list[ModuleScore]:
    return [
        ModuleScore(
            module_name=MODULES[i],
            z_score=1.5 if v == "bullish" else -1.5 if v == "bearish" else 0.0,
            vote=v,
        )
        for i, v in enumerate(votes)
    ]


def test_strong_buy_5_of_5():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "bullish"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.STRONG_BUY
    assert result.confluence_count == 5


def test_buy_4_of_5():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.BUY
    assert result.confluence_count == 4


def test_hold_3_of_5():
    scores = _make_scores(["bullish", "bullish", "bullish", "neutral", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.HOLD
    assert result.confluence_count == 3


def test_hold_mixed():
    scores = _make_scores(["bullish", "bullish", "bearish", "bearish", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.HOLD


def test_sell_4_of_5():
    scores = _make_scores(["bearish", "bearish", "bearish", "bearish", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.SELL
    assert result.confluence_count == 4


def test_strong_sell_5_of_5():
    scores = _make_scores(["bearish", "bearish", "bearish", "bearish", "bearish"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.STRONG_SELL
    assert result.confluence_count == 5


def test_shock_detected_macro():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "neutral"])
    scores[2] = ModuleScore(module_name="macro-analyst", z_score=-2.0, vote="bearish")
    result = vote(scores)
    assert result.shock_detected is True


def test_shock_detected_news():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "neutral"])
    scores[3] = ModuleScore(module_name="news-briefing", z_score=-2.0, vote="bearish")
    result = vote(scores)
    assert result.shock_detected is True


def test_no_shock_normal_conditions():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "bullish"])
    result = vote(scores)
    assert result.shock_detected is False
