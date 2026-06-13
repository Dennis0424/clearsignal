# ClearSignal v3 — Decision Autopsy System

**Date:** 2026-06-13
**Goal:** Add behavioral finance guardrails that no other trading app has — FOMO detection, regret simulation, decision journaling, and outcome tracking.

---

## Problem

Retail traders lose money primarily due to:
1. FOMO buying (chasing pumps, buying at peaks)
2. No accountability (forget why they traded, repeat mistakes)
3. No feedback loop (never learn whether their reasoning was good)

Every other hackathon project shows more data. ClearSignal protects users from themselves.

---

## Features

### 1. FOMO Detector

Triggered when user attempts to trade. Checks 4 signals:

| Signal | Detection Method | Threshold |
|--------|-----------------|-----------|
| Price spike | yfinance: compare current price to 24h ago | >5% = warning |
| Social hype | Reddit mentions + news volume | Above 2x weekly average |
| Near 52-week high | Current price vs 52-week high | Within 5% = warning |
| Trade frequency | Count user's trades in last 24h from DB | >3 = tilt warning |

**Output:** FOMO risk score (LOW / MODERATE / HIGH) + one-line data-backed warning.

**LLM Enhancement:** Qwen generates a personalized warning message using the data context.

### 2. Regret Simulator

Shows the user their potential losses in concrete dollar amounts:

- Input: symbol, quantity, current price
- Output: loss at -10%, -20%, -50% drawdown scenarios
- Includes historical context: "The last time {ticker} dropped 20% was {date} — it took {N} days to recover"

**Key:** Presents loss in DOLLARS, not percentages. $6,800 hits harder than "20%."

### 3. Decision Journal

Before executing a trade, user must record:

- **Reasoning** (text, 1-3 sentences): "Why are you buying this today?"
- **Confidence** (1-10): How sure are you?
- **Time horizon**: 1 day / 1 week / 1 month / 3 months

Stored in SQLite. Used later for autopsy analysis.

### 4. Autopsy Report

Analyzes the user's decision history:

- Win rate (% of trades that were profitable at stated time horizon)
- FOMO vs Calm trade performance comparison
- Average confidence vs actual accuracy (calibration)
- Pattern detection via LLM: "You tend to overtrade on Mondays" / "Your high-confidence trades outperform"

---

## Architecture

### New Files

```
backend/
├── agents/
│   └── fomo_detector.py   # FOMO signal checks + LLM warning
```

### Database Schema Addition

```sql
CREATE TABLE decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    side TEXT NOT NULL,         -- buy/sell
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    fomo_score TEXT NOT NULL,   -- LOW/MODERATE/HIGH
    fomo_signals TEXT,          -- JSON: which signals triggered
    reasoning TEXT NOT NULL,
    confidence INTEGER NOT NULL, -- 1-10
    time_horizon TEXT NOT NULL,  -- 1d/1w/1m/3m
    outcome_price REAL,         -- filled later
    outcome_pct REAL,           -- filled later
    created_at TEXT NOT NULL,
    resolved_at TEXT
);
```

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /fomo-check/{ticker}` | POST | Run FOMO detection, return risk score + warning |
| `POST /decision` | POST | Save decision journal entry + execute trade |
| `GET /decisions` | GET | List all past decisions with outcomes |
| `GET /autopsy` | GET | Aggregated stats + LLM pattern analysis |

### Frontend Changes

The Trade panel on Deep Dive becomes a **multi-step modal flow**:

```
Step 1: FOMO Check (auto-runs, shows risk level)
Step 2: Regret Simulator (shows dollar losses)
Step 3: Decision Journal (reasoning + confidence + horizon)
Step 4: Confirm & Execute (trade goes through)
```

New section/page: **"My Decisions"** — table of past trades with:
- Original reasoning
- Confidence at time of trade
- Actual outcome (auto-resolved when time horizon expires)
- FOMO score badge

New section: **"Autopsy Report"** — summary stats + LLM insights.

---

## UX Principles

- **Never block** — user can always proceed. We inform, not restrict.
- **Fast** — FOMO check should return in <2 seconds (no LLM call for detection, only for the warning message)
- **Visceral** — dollar losses, not percentages. Red numbers. Real impact.
- **Non-judgmental** — "Here's what the data says" not "You're being stupid"

---

## Implementation Priority

1. FOMO detector (backend + frontend step 1-2)
2. Decision journal (DB + endpoint + frontend step 3-4)
3. Decisions list page (GET /decisions + frontend table)
4. Autopsy report (aggregation + LLM pattern analysis)

---

## Demo Script (for hackathon judges)

1. Research AAPL on Deep Dive → show chart + debate
2. Click Buy → FOMO detector triggers "Price up 8% today, MODERATE FOMO"
3. Regret simulator shows "$3,400 loss if 20% drop"
4. Record reasoning: "I think AI revenue will beat expectations"
5. Execute trade
6. Switch to Autopsy page → show historical accuracy
7. Punchline: "ClearSignal doesn't just help you find trades — it helps you not screw them up"
