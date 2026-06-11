import pytest
from unittest.mock import patch, AsyncMock
from app.explainer import build_explanation_prompt, generate_explanation
from signal_engine.models import ModuleScore, Verdict, VerdictType


def _make_verdict() -> Verdict:
    scores = [
        ModuleScore("technical-analysis", 1.8, "bullish"),
        ModuleScore("sentiment-analyst", 1.5, "bullish"),
        ModuleScore("macro-analyst", -0.3, "neutral"),
        ModuleScore("news-briefing", 1.2, "bullish"),
        ModuleScore("market-intel", 1.6, "bullish"),
    ]
    return Verdict(
        verdict_type=VerdictType.BUY,
        confluence_count=4,
        total_modules=5,
        scores=scores,
        shock_detected=False,
    )


def test_build_prompt_contains_ticker():
    verdict = _make_verdict()
    prompt = build_explanation_prompt("AAPL", verdict)
    assert "AAPL" in prompt


def test_build_prompt_contains_verdict():
    verdict = _make_verdict()
    prompt = build_explanation_prompt("AAPL", verdict)
    assert "BUY" in prompt


def test_build_prompt_contains_all_modules():
    verdict = _make_verdict()
    prompt = build_explanation_prompt("AAPL", verdict)
    assert "technical-analysis" in prompt
    assert "sentiment-analyst" in prompt
    assert "macro-analyst" in prompt
    assert "news-briefing" in prompt
    assert "market-intel" in prompt


def test_build_prompt_contains_z_scores():
    verdict = _make_verdict()
    prompt = build_explanation_prompt("AAPL", verdict)
    assert "1.8" in prompt
    assert "-0.3" in prompt


def test_build_prompt_mentions_shock_when_detected():
    verdict = _make_verdict()
    verdict.shock_detected = True
    prompt = build_explanation_prompt("AAPL", verdict)
    assert "shock" in prompt.lower()


def test_build_prompt_no_shock_mention_when_not_detected():
    verdict = _make_verdict()
    prompt = build_explanation_prompt("AAPL", verdict)
    assert "shock detected" not in prompt.lower()


@pytest.mark.asyncio
async def test_generate_explanation_calls_llm():
    verdict = _make_verdict()
    mock_client = AsyncMock()
    mock_client.complete = AsyncMock(return_value="AAPL is bullish because technicals are strong.")

    with patch("app.explainer.get_llm_client", return_value=mock_client):
        result = await generate_explanation("AAPL", verdict)

    assert result == "AAPL is bullish because technicals are strong."
    mock_client.complete.assert_called_once()


@pytest.mark.asyncio
async def test_generate_explanation_returns_none_on_failure():
    verdict = _make_verdict()
    mock_client = AsyncMock()
    mock_client.complete = AsyncMock(side_effect=Exception("API down"))

    with patch("app.explainer.get_llm_client", return_value=mock_client):
        result = await generate_explanation("AAPL", verdict)

    assert result is None
