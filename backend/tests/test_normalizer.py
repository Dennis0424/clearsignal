from signal_engine.models import SignalInput, ModuleScore
from signal_engine.normalizer import normalize


def test_normalize_bullish():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=72.5,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert isinstance(result, ModuleScore)
    assert result.z_score == 2.0  # clamped from 2.25
    assert result.vote == "bullish"


def test_normalize_bearish():
    sig = SignalInput(
        module_name="sentiment-analyst",
        raw_value=30.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == -2.0
    assert result.vote == "bearish"


def test_normalize_neutral():
    sig = SignalInput(
        module_name="macro-analyst",
        raw_value=52.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == 0.2
    assert result.vote == "neutral"


def test_normalize_exact_threshold_bullish():
    sig = SignalInput(
        module_name="news-briefing",
        raw_value=60.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == 1.0
    assert result.vote == "neutral"  # z == 1.0 is NOT bullish (must be > 1.0)


def test_normalize_exact_threshold_bearish():
    sig = SignalInput(
        module_name="market-intel",
        raw_value=40.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == -1.0
    assert result.vote == "neutral"  # z == -1.0 is NOT bearish (must be < -1.0)


def test_normalize_zero_std_returns_neutral():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=50.0,
        historical_mean=50.0,
        historical_std=0.0,
    )
    result = normalize(sig)
    assert result.z_score == 0.0
    assert result.vote == "neutral"


def test_normalize_clamps_positive():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=100.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == 2.0
    assert result.vote == "bullish"


def test_normalize_clamps_negative():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=0.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == -2.0
    assert result.vote == "bearish"
