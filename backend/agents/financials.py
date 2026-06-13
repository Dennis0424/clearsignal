import yfinance as yf


def get_financials(ticker: str) -> dict:
    """Fetch key financial metrics for a ticker using yfinance."""
    stock = yf.Ticker(ticker)

    info = stock.info or {}

    metrics = {
        "ticker": ticker,
        "company_name": info.get("longName", ticker),
        "sector": info.get("sector", "Unknown"),
        "industry": info.get("industry", "Unknown"),
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),
        "peg_ratio": info.get("pegRatio"),
        "price_to_book": info.get("priceToBook"),
        "debt_to_equity": info.get("debtToEquity"),
        "revenue": info.get("totalRevenue"),
        "revenue_growth": info.get("revenueGrowth"),
        "profit_margin": info.get("profitMargins"),
        "operating_margin": info.get("operatingMargins"),
        "free_cash_flow": info.get("freeCashflow"),
        "dividend_yield": info.get("dividendYield"),
        "beta": info.get("beta"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "target_mean_price": info.get("targetMeanPrice"),
        "recommendation": info.get("recommendationKey"),
    }

    return {k: v for k, v in metrics.items() if v is not None}


def format_financials_for_prompt(data: dict) -> str:
    """Format financial data into readable text for LLM context."""
    lines = [f"=== {data.get('company_name', data['ticker'])} Financial Summary ==="]
    lines.append(f"Sector: {data.get('sector', 'N/A')} | Industry: {data.get('industry', 'N/A')}")

    if data.get("current_price"):
        lines.append(f"Current Price: ${data['current_price']:.2f}")
    if data.get("market_cap"):
        cap = data["market_cap"]
        if cap >= 1e12:
            lines.append(f"Market Cap: ${cap/1e12:.2f}T")
        elif cap >= 1e9:
            lines.append(f"Market Cap: ${cap/1e9:.2f}B")
        else:
            lines.append(f"Market Cap: ${cap/1e6:.0f}M")

    lines.append("\n--- Valuation ---")
    if data.get("pe_ratio"):
        lines.append(f"P/E Ratio: {data['pe_ratio']:.1f}")
    if data.get("forward_pe"):
        lines.append(f"Forward P/E: {data['forward_pe']:.1f}")
    if data.get("peg_ratio"):
        lines.append(f"PEG Ratio: {data['peg_ratio']:.2f}")
    if data.get("price_to_book"):
        lines.append(f"Price/Book: {data['price_to_book']:.2f}")

    lines.append("\n--- Growth & Profitability ---")
    if data.get("revenue"):
        lines.append(f"Revenue: ${data['revenue']/1e9:.2f}B")
    if data.get("revenue_growth"):
        lines.append(f"Revenue Growth: {data['revenue_growth']*100:.1f}%")
    if data.get("profit_margin"):
        lines.append(f"Profit Margin: {data['profit_margin']*100:.1f}%")
    if data.get("operating_margin"):
        lines.append(f"Operating Margin: {data['operating_margin']*100:.1f}%")
    if data.get("free_cash_flow"):
        lines.append(f"Free Cash Flow: ${data['free_cash_flow']/1e9:.2f}B")

    lines.append("\n--- Risk ---")
    if data.get("debt_to_equity"):
        lines.append(f"Debt/Equity: {data['debt_to_equity']:.1f}")
    if data.get("beta"):
        lines.append(f"Beta: {data['beta']:.2f}")
    if data.get("fifty_two_week_high") and data.get("fifty_two_week_low"):
        lines.append(f"52-Week Range: ${data['fifty_two_week_low']:.2f} - ${data['fifty_two_week_high']:.2f}")

    if data.get("target_mean_price"):
        lines.append(f"\nAnalyst Target: ${data['target_mean_price']:.2f}")
    if data.get("recommendation"):
        lines.append(f"Analyst Consensus: {data['recommendation'].upper()}")

    return "\n".join(lines)
