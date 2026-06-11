# ClearSignal

**The Bloomberg Terminal for retail** — a transparent, rule-anchored US stock signal engine that shows its full reasoning chain.

Built for [Bitget Hackathon S1](https://www.bitget.com/) — Track 3: US Stock AI Trading.

## Problem

Every AI trading tool has the same problem: ask it twice, get two answers. LLMs are probabilistic — they guess, not decide. When retail traders can't understand why the AI made a call, they can't learn from losses or trust the signal.

## Solution

ClearSignal eliminates this with a **deterministic signal engine**:

1. Pulls all 5 Bitget skill modules in parallel (macro, sentiment, technicals, news, whale activity)
2. Normalizes each using Z-scores against historical baselines
3. Fires a verdict only when **4+ of 5 signals agree** (Signal Confluence)
4. An LLM writes a plain-English explanation — it narrates, it does not decide

**Same inputs = same verdict, every time.**

## Features

- **Signal Dashboard** — Enter a ticker, get a BUY/HOLD/SELL verdict with full score breakdown
- **Head-to-Head** — ClearSignal (deterministic) vs raw LLM (probabilistic) side-by-side
- **Replay Mode** — Pick any past date + ticker, see what ClearSignal would have said
- **Sim Trade Log** — Every signal logged with timestamp, exportable as CSV
- **Shock Detection** — Warning when macro/news Z-score indicates fear-driven distortion

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python (FastAPI) |
| Signal Engine | Z-score normalization + Confluence voting |
| LLM | Provider-agnostic (Qwen, Claude, OpenAI) |
| Database | SQLite |
| Frontend | React + Tailwind CSS + TypeScript |
| Data Source | Bitget MCP tools (5 modules) |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Qwen API key (free via Alibaba Cloud)

### Backend

```bash
cd backend
python -m venv ../.venv
source ../.venv/Scripts/activate  # Windows
# source ../.venv/bin/activate    # macOS/Linux

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your LLM_API_KEY

python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the frontend proxies API calls to the backend.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `qwen` | LLM provider: `qwen`, `claude`, `openai` |
| `LLM_API_KEY` | — | Your API key |
| `LLM_MODEL` | `qwen-plus` | Model override |
| `LLM_ENDPOINT` | — | Custom endpoint (e.g. Ollama) |

## Architecture

```
User enters ticker
        |
FastAPI backend receives request
        |
5 Bitget MCP tools called in parallel
  - macro-analyst
  - sentiment-analyst
  - technical-analysis
  - news-briefing
  - market-intel
        |
Each response -> Z-score normalizer -> score: -2 to +2
        |
Confluence voter: 4/5 agree = BUY/SELL, 5/5 = STRONG
        |
LLM generates explanation (narrates, does not decide)
        |
Result stored in SQLite + returned to frontend
```

**Key invariant:** The LLM only writes the explanation. The confluence engine makes the decision.

## Tests

```bash
cd backend
python -m pytest tests/ -v
# 65 tests passing
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze` | Analyze a ticker, returns verdict + scores + explanation |
| POST | `/compare` | Head-to-head: ClearSignal vs raw LLM |
| GET | `/history` | Trade log (optional `?ticker=AAPL` filter) |

## License

MIT
