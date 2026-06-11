from signal_engine.models import SignalInput, ModuleScore, Verdict, VerdictType


def test_signal_input_creation():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=72.5,
        historical_mean=50.0,
        historical_std=10.0,
    )
    assert sig.module_name == "technical-analysis"
    assert sig.raw_value == 72.5


def test_module_score_vote_bullish():
    score = ModuleScore(module_name="technical-analysis", z_score=1.5, vote="bullish")
    assert score.vote == "bullish"


def test_module_score_vote_bearish():
    score = ModuleScore(module_name="sentiment-analyst", z_score=-1.3, vote="bearish")
    assert score.vote == "bearish"


def test_module_score_vote_neutral():
    score = ModuleScore(module_name="macro-analyst", z_score=0.4, vote="neutral")
    assert score.vote == "neutral"


def test_verdict_creation():
    verdict = Verdict(
        verdict_type=VerdictType.BUY,
        confluence_count=4,
        total_modules=5,
        scores=[],
        shock_detected=False,
    )
    assert verdict.verdict_type == VerdictType.BUY
    assert verdict.confluence_count == 4
