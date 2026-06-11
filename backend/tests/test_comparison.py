import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from signal_engine.models import SignalInput


def _mock_signals():
    return [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),
        SignalInput("macro-analyst", 68.0, 50.0, 10.0),
        SignalInput("news-briefing", 70.0, 50.0, 10.0),
        SignalInput("market-intel", 65.0, 50.0, 10.0),
    ]


@pytest.mark.asyncio
async def test_compare_endpoint():
    with patch("app.routes.fetch_all_signals", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = _mock_signals()
        with patch("app.routes.get_llm_comparison", new_callable=AsyncMock) as mock_compare:
            mock_compare.return_value = "I think AAPL is a good buy because..."
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post("/compare", json={"ticker": "AAPL"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["ticker"] == "AAPL"
            assert data["clearsignal_verdict"] == "STRONG_BUY"
            assert data["llm_raw_answer"] == "I think AAPL is a good buy because..."
            assert "clearsignal_explanation" in data


@pytest.mark.asyncio
async def test_compare_endpoint_llm_fails():
    with patch("app.routes.fetch_all_signals", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = _mock_signals()
        with patch("app.routes.get_llm_comparison", new_callable=AsyncMock) as mock_compare:
            mock_compare.return_value = None
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post("/compare", json={"ticker": "AAPL"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["llm_raw_answer"] is None
