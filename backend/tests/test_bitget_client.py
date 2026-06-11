from app.bitget_client import parse_module_response, MODULES


def test_modules_list():
    assert len(MODULES) == 5
    assert "technical-analysis" in MODULES
    assert "sentiment-analyst" in MODULES
    assert "macro-analyst" in MODULES
    assert "news-briefing" in MODULES
    assert "market-intel" in MODULES


def test_parse_module_response_valid():
    raw = {
        "module": "technical-analysis",
        "value": 72.5,
        "mean": 50.0,
        "std": 10.0,
    }
    result = parse_module_response(raw)
    assert result.module_name == "technical-analysis"
    assert result.raw_value == 72.5
    assert result.historical_mean == 50.0
    assert result.historical_std == 10.0


def test_parse_module_response_missing_std_defaults():
    raw = {
        "module": "news-briefing",
        "value": 60.0,
        "mean": 50.0,
    }
    result = parse_module_response(raw)
    assert result.historical_std == 10.0


def test_parse_module_response_zero_std_defaults():
    raw = {
        "module": "macro-analyst",
        "value": 55.0,
        "mean": 50.0,
        "std": 0.0,
    }
    result = parse_module_response(raw)
    assert result.historical_std == 10.0
