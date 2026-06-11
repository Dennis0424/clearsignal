# ClearSignal — Design Spec
**Date:** 2026-06-10 (revised 2026-06-11)  
**Track:** Bitget Hackathon S1 — Track 3: US Stock AI Trading  
**Deadline:** 2026-06-25

---

## Problem Statement

AI trading tools are black boxes — same stock, different AI, different answer. Retail traders using LLM-based signals face two core failures:

1. **Non-determinism:** LLM decisions are probabilistic. Same input can produce different outputs, making signals unreliable and untrustworthy.
2. **No explainability:** Traders cannot understand why the AI made a decision, making it impossible to learn from or audit losses.

Additionally, AI systems are hypersensitive to macro shocks (Fed announcements, geopolitical news), amplifying fear-driven sell-offs rather than helping traders stay rational.

**ClearSignal** is the Bloomberg Terminal for retail — a transparent, rule-anchored US stock signal engine that shows its full reasoning chain. The AI narrates — it does not decide.

---

## Solution Overview

ClearSignal pulls 5 Bitget data sources in parallel, normalizes each signal against its baseline via Z-score, fires a verdict only when ≥4/5 signals agree (Signal Confluence), and displays the full reasoning chain so traders know exactly why the AI said what it said.

**Killer differentiator:** A replay mode lets users (and judges) pick any past date + ticker, see what ClearSignal would have said, then compare against what actually happened. Transparent. Verifiable. Auditable.

---

## Architecture

### Three Layers

| Layer | Technology |
|---|---|
| Backend | Python (FastAPI) |
| Bitget MCP tools | `npx bitget-hub` (5 skill modules) |
| Signal engine | Z-score normalization + Confluence voting |
| LLM (explanation only) | Claude API |
| Database | SQLite (sim trade log + historical replay cache) |
| Frontend | React + Tailwind CSS |
| Hosting | Local for demo / Vercel + Railway for live |

### Request Flow

```
User enters ticker (+ optional past date for replay mode)
        ↓
FastAPI backend receives request
        ↓
5 Bitget MCP tools called in parallel (async)
  - macro-analyst
  - sentiment-analyst
  - technical-analysis
  - news-briefing
  - market-intel
        ↓
Each response → Z-score normalizer → score: -2 to +2
        ↓
Confluence voter: count signals above threshold
  - 5/5 agree → Strong BUY/SELL
  - 4/5 agree → BUY/SELL
  - ≤3/5 agree → HOLD
        ↓
Verdict + all scores + raw data → Claude API
Claude generates plain-English explanation (deterministic prompt template)
        ↓
Result stored in SQLite sim trade log (timestamped)
        ↓
Frontend renders dashboard
```

**Key invariant:** Claude only writes the explanation. The confluence engine makes the decision. Same inputs always produce the same verdict.

---

## Scoring Engine

### Bitget Modules & What They Measure

| Module | Signal Type |
|---|---|
| `technical-analysis` | RSI, MACD, Bollinger Bands, moving averages (23 indicators) |
| `sentiment-analyst` | Fear & Greed Index, funding rates, long/short ratios |
| `macro-analyst` | Fed stance, DXY trend, Nasdaq/BTC correlation |
| `news-briefing` | Recent news tone for the ticker (keyword search) |
| `market-intel` | ETF flows, whale activity, DeFi TVL |

### Z-Score Normalization

Each raw signal value is normalized against its historical baseline before voting:

```
z = (current_value - historical_mean) / historical_std
```

A Z-score is then mapped to a vote: `z > 1.0` → bullish vote, `z < -1.0` → bearish vote, else → neutral (abstain).

This prevents a mildly elevated RSI from voting the same as an extremely elevated RSI.

### Confluence Voting

- Count bullish votes vs bearish votes across 5 modules
- **≥4 bullish** → BUY
- **≥4 bearish** → SELL
- **Otherwise** → HOLD

### Confidence Calibration

Track historical accuracy of each confidence level:
- "Strong BUY (5/5) signals were correct **X%** of the time"
- "BUY (4/5) signals were correct **Y%** of the time"

Displayed on the dashboard as a calibration badge. Gives judges a concrete number, not just architecture hand-waving.

### Shock Flag

If `macro-analyst` or `news-briefing` returns a Z-score < -2.0, a warning banner appears:
> "⚠️ Macro/news shock detected — signal may be distorted by fear-driven conditions. Exercise caution."

---

## Frontend

### View 1: Signal Dashboard (main)
- Ticker search bar
- Large verdict badge: **BUY / HOLD / SELL** (color-coded, animated on arrival)
- Confluence confidence: "4/5 signals agree" + calibration accuracy badge
- Score breakdown card per module (normalized score + one-line reason + sparkline)
- Shock warning banner (conditional)
- Plain-English AI explanation paragraph
- **Head-to-head panel:** "What ChatGPT said" vs "What ClearSignal said" for the same ticker — directly proving the non-determinism thesis

### View 2: Replay Mode
- Date picker + ticker input
- Shows what ClearSignal would have said on that date
- Overlays what actually happened (price movement 1d/5d/30d after signal)
- Win/loss badge with percentage move
- This is the **demo killer feature** — judges can verify claims interactively

### View 3: Sim Trade Log
- Table: Date / Ticker / Verdict / Confluence Score / Actual Outcome / P&L
- Overall accuracy stats at the top (win rate, avg return on BUY signals)
- Downloadable as CSV
- Serves as verifiable evidence for hackathon judges

No authentication required. Enter ticker → get signal.

---

## Demo Strategy

The demo is everything. Judges spend ~2 minutes per project. Optimize for:

1. **Opening hook (15 sec):** "Ask ChatGPT if you should buy AAPL. Ask again. Different answer. That's the problem."
2. **Live signal (30 sec):** Enter a ticker, show the dashboard populate in real-time with all 5 modules scoring
3. **Replay proof (30 sec):** Pick a past date, show what ClearSignal said, reveal actual outcome — "we were right"
4. **Head-to-head (15 sec):** Side-by-side panel showing ChatGPT's inconsistent answer vs ClearSignal's deterministic verdict
5. **Calibration stat (10 sec):** "Our Strong BUY signals have been correct X% of the time across N signals"
6. **Close (10 sec):** "No black box. Every signal explained. Every decision logged. Built entirely on Bitget's US stock data."

---

## Hackathon Submission Requirements

| Requirement | How we satisfy it |
|---|---|
| Demo link or GitHub repo | GitHub repo + live deploy (Railway/Vercel) |
| Project description ≤200 words | Addresses non-determinism + explainability problems |
| Solves a real problem in tokenized US stock trading | Yes — LLM non-determinism + black-box explainability |
| Verifiable backtest or sim trading records | SQLite sim trade log + replay mode with actual outcomes |
| Uses Bitget's US stock data or tools | All 5 Bitget MCP skill modules used |
| Demo is real and runnable | FastAPI backend + React frontend, fully runnable |

### 200-Word Pitch (Final)
> Every AI trading tool has the same problem: ask it twice, get two answers. LLMs are probabilistic — they guess, not decide. When retail traders can't understand why the AI made a call, they can't learn from losses or trust the signal.
>
> ClearSignal eliminates this. Our deterministic signal engine pulls all 5 Bitget skill modules in parallel — macro, sentiment, technicals, news, and whale activity — normalizes each using Z-scores against historical baselines, and fires a verdict only when 4+ of 5 signals agree (Signal Confluence). Same inputs, same verdict, every time.
>
> Claude then writes a plain-English explanation of exactly which signals agreed, why each scored the way it did, and whether a macro shock may be distorting the result.
>
> But we don't ask you to trust us. Replay mode lets you pick any past date and ticker, see what ClearSignal would have said, and compare against what actually happened. Our Strong BUY signals show their historical accuracy right on the dashboard.
>
> The result: a BUY/HOLD/SELL signal you can audit, challenge, replay, and trust. Every decision logged. No black box. The Bloomberg Terminal for retail, built on Bitget.

---

## Build Plan (14 days)

| Days | Milestone | Verify |
|---|---|---|
| 1-2 | Bitget MCP setup, test all 5 skill modules | Each module returns valid data for 3+ tickers |
| 3-4 | Z-score normalizer + confluence engine (Python) | Unit tests pass for known inputs |
| 5 | FastAPI backend + SQLite sim log | `/analyze` endpoint returns verdict JSON |
| 6 | Replay mode backend (historical data fetch + outcome overlay) | `/replay` endpoint returns signal + actual outcome |
| 7-8 | React frontend — Signal Dashboard + Replay Mode | Dashboard renders live signal in < 3 sec |
| 9 | Claude explanation integration | Explanation paragraph appears, references all 5 scores |
| 10 | Head-to-head panel (ChatGPT comparison) | Side-by-side renders with cached ChatGPT response |
| 11 | Confidence calibration + sim trade log population | Accuracy stats compute correctly from log |
| 12 | End-to-end testing, polish animations, mobile responsive | Full flow works on phone screen |
| 13 | Demo video recording + script rehearsal | Video is under 3 minutes, hits all 6 demo beats |
| 14 | Submission polish + GitHub README + deploy | Live URL works, README has screenshots |

---

## Open Questions

- Which US stock tickers does Bitget's data cover? Need to verify coverage during setup.
- Historical baseline for Z-score: **rolling 30-day window** (default). Configurable per module if needed.
- ChatGPT comparison: cache responses or call live? (Cache is safer for demo reliability.)
- Replay mode data: does Bitget provide historical snapshots, or do we need to accumulate from day 1?
