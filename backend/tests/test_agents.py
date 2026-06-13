from unittest.mock import patch, AsyncMock
import pytest
from agents.financials import get_financials, format_financials_for_prompt
from agents.social_pulse import get_social_pulse, format_social_for_prompt
from agents.debate import run_debate


class TestFinancials:
    @patch("agents.financials.yf.Ticker")
    def test_get_financials_returns_dict(self, mock_ticker):
        mock_ticker.return_value.info = {
            "longName": "Apple Inc.",
            "sector": "Technology",
            "marketCap": 3_000_000_000_000,
            "trailingPE": 28.5,
            "currentPrice": 195.0,
        }
        result = get_financials("AAPL")
        assert result["ticker"] == "AAPL"
        assert result["company_name"] == "Apple Inc."
        assert result["market_cap"] == 3_000_000_000_000

    @patch("agents.financials.yf.Ticker")
    def test_get_financials_filters_none(self, mock_ticker):
        mock_ticker.return_value.info = {
            "longName": "Test Co",
            "sector": None,
            "marketCap": None,
            "currentPrice": 50.0,
        }
        result = get_financials("TEST")
        assert "sector" not in result
        assert "market_cap" not in result
        assert result["current_price"] == 50.0

    def test_format_financials_basic(self):
        data = {
            "ticker": "AAPL",
            "company_name": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "current_price": 195.0,
            "market_cap": 3_000_000_000_000,
            "pe_ratio": 28.5,
        }
        output = format_financials_for_prompt(data)
        assert "Apple Inc." in output
        assert "$195.00" in output
        assert "$3.00T" in output
        assert "28.5" in output


class TestSocialPulse:
    @patch("agents.social_pulse.yf.Ticker")
    @patch("agents.social_pulse.httpx.get")
    def test_get_social_pulse_structure(self, mock_get, mock_ticker):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"data": {"children": []}}
        mock_ticker.return_value.news = [
            {"title": "AAPL beats earnings", "publisher": "Reuters", "link": "http://x.com"}
        ]
        result = get_social_pulse("AAPL")
        assert result["ticker"] == "AAPL"
        assert "reddit" in result
        assert "news_headlines" in result
        assert len(result["news_headlines"]) == 1

    def test_format_social_basic(self):
        data = {
            "ticker": "AAPL",
            "reddit": {"reddit_mentions": 5, "top_posts": []},
            "news_headlines": [{"title": "Apple news", "publisher": "WSJ"}],
            "total_signals": 6,
        }
        output = format_social_for_prompt(data)
        assert "AAPL" in output
        assert "Reddit mentions" in output
        assert "Apple news" in output


class TestDebate:
    @pytest.mark.asyncio
    @patch("agents.debate.get_llm_client")
    async def test_run_debate_sequential(self, mock_get_client):
        mock_client = AsyncMock()
        mock_client.complete = AsyncMock(side_effect=[
            "Bull says buy!",
            "Bear says sell!",
            "Judge says hold.",
        ])
        mock_get_client.return_value = mock_client

        result = await run_debate("AAPL", "test context")
        assert result["ticker"] == "AAPL"
        assert result["bull"] == "Bull says buy!"
        assert result["bear"] == "Bear says sell!"
        assert result["judge"] == "Judge says hold."
        assert mock_client.complete.call_count == 3
