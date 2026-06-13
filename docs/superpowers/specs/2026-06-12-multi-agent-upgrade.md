# ClearSignal v2 — Multi-Agent Deep Dive & Debate

**Date:** 2026-06-12
**Goal:** Transform ClearSignal from a signal dashboard into a multi-agent research + debate system.

---

## New Features

### 1. Financials Agent

Pulls company financial data from free sources and computes key metrics.

**Data sources (all free):**
- Yahoo Finance (via yfinance Python library) — income statement, balance sheet, cash flow
- Computed ratios: P/E, debt-to-equity, revenue growth YoY, free cash flow margin

**Output:** Structured financial summary with key metrics + brief LLM interpretation.

### 2. Social Pulse Agent

Aggregates real-time sentiment from social media and news.

**Data sources (all free):**
- Reddit API (r/wallstreetbets, r/stocks, r/investing) — recent mentions + sentiment
- Web search for recent news headlines
- Note: Twitter/X requires paid API — use news + Reddit as proxy

**Output:** Sentiment score (bullish/bearish/neutral ratio), trending topics, notable mentions.

### 3. Bull vs Bear Debate

Three sequential LLM calls using ALL gathered data as context:

```
[Signal Engine Scores + Financials + Social Pulse]
        ↓
   Bull Agent: "Here's why you should BUY..."
        ↓
   Bear Agent: "Here's why you should NOT BUY..." (sees Bull's argument)
        ↓
   Judge Agent: "After evaluating both sides..." (sees both arguments)
        ↓
   Final verdict with confidence
```

**Key:** Each agent sees the previous agent's output → genuine argumentation, not parallel opinions.

---

## Architecture

### New Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/research/{ticker}` | GET | Runs Financials + Social Pulse agents in parallel, returns combined data |
| `/debate/{ticker}` | POST | Runs full pipeline: signal + research + Bull/Bear/Judge debate |

### New Files

```
backend/
├── agents/
│   ├── __init__.py
│   ├── financials.py    # Yahoo Finance data fetcher + ratio calculator
│   ├── social_pulse.py  # Reddit + news sentiment aggregator
│   └── debate.py        # Bull/Bear/Judge orchestration
```

### Frontend — "Deep Dive" Page

- Ticker input at top
- Three-column layout:
  - Left: Financial metrics card (ratios, revenue, profit)
  - Right: Social pulse card (sentiment gauge, trending topics)
  - Bottom full-width: Debate panel (Bull → Bear → Judge, chat-bubble style)
- Loading states show agents "working" with agent avatars

---

## Debate Prompt Design

### Bull Agent
```
You are a senior equity analyst BULL. Your job is to make the STRONGEST possible 
case for BUYING {ticker}. Use the provided data — financial metrics, social 
sentiment, and technical signals — to argue your position. Be specific. Cite numbers.
Max 150 words.
```

### Bear Agent
```
You are a senior equity analyst BEAR. You've just read the Bull's argument below.
Your job is to make the STRONGEST possible case AGAINST buying {ticker}.
Attack the Bull's specific claims using the data. Find risks they ignored.
Max 150 words.

Bull's argument: {bull_response}
```

### Judge Agent
```
You are a neutral senior portfolio manager judging this debate about {ticker}.
Read both arguments. Decide which side made a stronger case and why.
Award a confidence score (1-10) for each side. State your final recommendation.
Be concise. Max 100 words.

Bull: {bull_response}
Bear: {bear_response}
```

---

## Implementation Priority

1. Financials agent (yfinance — reliable, fast, no API key needed)
2. Debate system (just LLM calls with structured prompts)
3. Social pulse (Reddit API — needs registration but free)
4. Frontend Deep Dive page

If Reddit API isn't ready by demo: use news headlines via web search as fallback.
