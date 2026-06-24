import httpx
import yfinance as yf
from curl_cffi.requests import Session as CurlSession


def get_reddit_sentiment(ticker: str, limit: int = 10) -> dict:
    """Fetch recent mentions from Reddit investing subreddits (public JSON, no auth)."""
    subreddits = ["wallstreetbets", "stocks", "investing"]
    mentions = []

    for sub in subreddits:
        url = f"https://www.reddit.com/r/{sub}/search.json"
        params = {"q": ticker, "sort": "new", "limit": limit, "restrict_sr": "on", "t": "week"}
        headers = {"User-Agent": "ClearSignal/1.0"}
        try:
            resp = httpx.get(url, params=params, headers=headers, timeout=10)
            if resp.status_code != 200:
                continue
            posts = resp.json().get("data", {}).get("children", [])
            for post in posts:
                data = post.get("data", {})
                mentions.append({
                    "subreddit": sub,
                    "title": data.get("title", ""),
                    "score": data.get("score", 0),
                    "num_comments": data.get("num_comments", 0),
                    "url": f"https://reddit.com{data.get('permalink', '')}",
                })
        except (httpx.HTTPError, Exception):
            continue

    return {
        "ticker": ticker,
        "reddit_mentions": len(mentions),
        "top_posts": sorted(mentions, key=lambda x: x["score"], reverse=True)[:5],
    }


def get_news_headlines(ticker: str) -> list[dict]:
    """Fetch recent news headlines from yfinance."""
    session = CurlSession(impersonate="chrome")
    stock = yf.Ticker(ticker, session=session)
    news = stock.news or []
    headlines = []
    for item in news[:8]:
        # yfinance v0.2.50+ nests data under item['content']
        content = item.get("content", item)
        title = content.get("title", "")
        publisher = (content.get("provider") or {}).get("displayName", content.get("publisher", ""))
        link = (content.get("canonicalUrl") or {}).get("url", content.get("link", ""))
        if title:
            headlines.append({"title": title, "publisher": publisher, "link": link})
    return headlines


def get_social_pulse(ticker: str) -> dict:
    """Aggregate social + news data for a ticker."""
    reddit = get_reddit_sentiment(ticker)
    news = get_news_headlines(ticker)

    return {
        "ticker": ticker,
        "reddit": reddit,
        "news_headlines": news,
        "total_signals": reddit["reddit_mentions"] + len(news),
    }


def format_social_for_prompt(data: dict) -> str:
    """Format social pulse data into readable text for LLM context."""
    lines = [f"=== {data['ticker']} Social & News Pulse ==="]

    reddit = data.get("reddit", {})
    lines.append(f"\nReddit mentions (past week): {reddit.get('reddit_mentions', 0)}")
    top_posts = reddit.get("top_posts", [])
    if top_posts:
        lines.append("Top Reddit posts:")
        for p in top_posts:
            lines.append(f"  - [r/{p['subreddit']}] {p['title']} (score: {p['score']}, comments: {p['num_comments']})")

    news = data.get("news_headlines", [])
    if news:
        lines.append(f"\nRecent news ({len(news)} headlines):")
        for h in news:
            lines.append(f"  - {h['title']} ({h['publisher']})")

    lines.append(f"\nTotal social signals: {data.get('total_signals', 0)}")
    return "\n".join(lines)
