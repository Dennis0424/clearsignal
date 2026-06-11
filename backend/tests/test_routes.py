import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
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
async def test_analyze_endpoint():
    with patch("app.routes.fetch_all_signals", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = _mock_signals()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/analyze", json={"ticker": "AAPL"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["ticker"] == "AAPL"
        assert data["verdict"] == "STRONG_BUY"
        assert data["confluence_count"] == 5
        assert len(data["scores"]) == 5


@pytest.mark.asyncio
async def test_analyze_endpoint_hold():
    signals = [
        SignalInput("technical-analysis", 55.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 55.0, 50.0, 10.0),
        SignalInput("macro-analyst", 52.0, 50.0, 10.0),
        SignalInput("news-briefing", 48.0, 50.0, 10.0),
        SignalInput("market-intel", 51.0, 50.0, 10.0),
    ]
    with patch("app.routes.fetch_all_signals", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = signals
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/analyze", json={"ticker": "TSLA"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "HOLD"


@pytest.mark.asyncio
async def test_history_endpoint_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/history")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
