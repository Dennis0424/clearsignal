from app.schemas import AnalyzeRequest, AnalyzeResponse, ModuleScoreResponse, TradeLogEntry


def test_analyze_request_valid():
    req = AnalyzeRequest(ticker="AAPL")
    assert req.ticker == "AAPL"


def test_analyze_request_uppercase():
    req = AnalyzeRequest(ticker="aapl")
    assert req.ticker == "AAPL"


def test_analyze_response_structure():
    resp = AnalyzeResponse(
        ticker="AAPL",
        verdict="BUY",
        confluence_count=4,
        total_modules=5,
        shock_detected=False,
        scores=[
            ModuleScoreResponse(
                module_name="technical-analysis",
                z_score=1.5,
                vote="bullish",
            )
        ],
        explanation=None,
    )
    assert resp.verdict == "BUY"
    assert resp.scores[0].z_score == 1.5


def test_trade_log_entry():
    entry = TradeLogEntry(
        id=1,
        timestamp="2026-06-11T12:00:00",
        ticker="AAPL",
        verdict="BUY",
        confluence_count=4,
        total_modules=5,
        shock_detected=False,
    )
    assert entry.ticker == "AAPL"
