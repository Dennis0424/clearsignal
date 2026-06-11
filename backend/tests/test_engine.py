from signal_engine.models import SignalInput, VerdictType
from signal_engine.engine import analyze


def test_analyze_all_bullish():
    inputs = [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),
        SignalInput("macro-analyst", 68.0, 50.0, 10.0),
        SignalInput("news-briefing", 70.0, 50.0, 10.0),
        SignalInput("market-intel", 65.0, 50.0, 10.0),
    ]
    verdict = analyze(inputs)
    assert verdict.verdict_type == VerdictType.STRONG_BUY
    assert verdict.confluence_count == 5
    assert len(verdict.scores) == 5
    assert verdict.shock_detected is False


def test_analyze_mixed_hold():
    inputs = [
        SignalInput("technical-analysis", 55.0, 50.0, 10.0),  # z=0.5 neutral
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),   # z=2.0 bullish (clamped)
        SignalInput("macro-analyst", 52.0, 50.0, 10.0),       # z=0.2 neutral
        SignalInput("news-briefing", 48.0, 50.0, 10.0),       # z=-0.2 neutral
        SignalInput("market-intel", 65.0, 50.0, 10.0),        # z=1.5 bullish
    ]
    verdict = analyze(inputs)
    assert verdict.verdict_type == VerdictType.HOLD


def test_analyze_with_shock():
    inputs = [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),
        SignalInput("macro-analyst", 20.0, 50.0, 10.0),  # z=-3.0 clamped to -2.0 -> shock
        SignalInput("news-briefing", 70.0, 50.0, 10.0),
        SignalInput("market-intel", 65.0, 50.0, 10.0),
    ]
    verdict = analyze(inputs)
    assert verdict.shock_detected is True


def test_analyze_returns_correct_z_scores():
    inputs = [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),  # z=2.0 clamped
        SignalInput("sentiment-analyst", 30.0, 50.0, 10.0),   # z=-2.0
        SignalInput("macro-analyst", 50.0, 50.0, 10.0),       # z=0.0
        SignalInput("news-briefing", 50.0, 50.0, 10.0),       # z=0.0
        SignalInput("market-intel", 50.0, 50.0, 10.0),        # z=0.0
    ]
    verdict = analyze(inputs)
    scores_by_name = {s.module_name: s for s in verdict.scores}
    assert scores_by_name["technical-analysis"].z_score == 2.0
    assert scores_by_name["sentiment-analyst"].z_score == -2.0
    assert scores_by_name["macro-analyst"].z_score == 0.0
