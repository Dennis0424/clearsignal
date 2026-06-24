# ClearSignal

**AI-powered US stock signal engine with deterministic Bull/Bear debate** — built for Bitget Hackathon S1, Track 3: Open Innovation.

---

## What It Does

ClearSignal addresses a core problem with AI trading tools: ask an LLM twice, get two answers. ClearSignal uses a **deterministic signal engine** for the verdict, and an LLM **only to explain** — never to decide.

1. Enter any US stock ticker or crypto symbol
2. ClearSignal pulls live financials, Reddit sentiment, and news headlines in parallel
3. A Z-score confluence engine votes across 5 signal modules — BUY/HOLD/SELL fires only when 4+ agree
4. Two LLM agents argue Bull vs Bear, then a Judge issues a final verdict
5. Every trade decision is logged in a journal with FOMO score, confidence, and post-hoc autopsy

**Same inputs = same verdict, every time.**

---

## Live Features

| Feature | Description |
|---------|-------------|
| **Deep Dive Research** | Full AI debate (Bull vs Bear vs Judge) + financials + social pulse + analyst ratings |
| **Market Scanner** | Live price scanner with sparklines for preset watchlist |
| **Watchlist** | Custom watchlist with localStorage persistence |
| **Portfolio** | Bitget spot account viewer with demo fallback |
| **Decision Journal** | Log trades with reasoning, FOMO check, and confidence score |
| **Trade Autopsy** | LLM pattern analysis of past decisions — identifies behavioral mistakes |
| **Cooldown Timer** | Enforces a cooling-off period after a losing trade (proportional to loss size) |
| **Decision Roast** | Claude roasts your trading history in 2–3 brutal sentences |
| **Degen Score** | 0–100 behavioral risk score based on FOMO ratio, overconfidence, loss streaks |
| **What-If Simulator** | "What if I bought X at Y date?" time machine |
| **Correlation Matrix** | Pearson correlation between any set of tickers |
| **Insider Transactions** | Recent SEC Form 4 insider buy/sell activity |
| **Earnings Calendar** | Upcoming earnings dates + recent history |
| **AI Chat** | Ask any question about a stock, grounded in live data |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+ · FastAPI · SQLite |
| Signal Engine | Z-score normalization + Confluence voting |
| AI Agents | Multi-agent Bull/Bear/Judge debate |
| LLM | Qwen via Bitget hackathon endpoint (default) · configurable: Claude, OpenAI |
| Data | yfinance (stocks) · Bitget REST API (crypto) · Reddit public JSON |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS v4 |
| Animation | motion/react (Framer Motion v12) |
| Charts | Recharts |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Qwen API key (free via [Bitget hackathon endpoint](https://hackathon.bitgetops.com))

### 1. Clone

```bash
git clone https://github.com/Dennis0424/clearsignal.git
cd clearsignal
```

### 2. Backend

```bash
cd backend
python -m venv ../.venv

# Windows
source ../.venv/Scripts/activate
# macOS/Linux
# source ../.venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env — set your LLM_API_KEY
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (or the next available port). The Vite config proxies all `/api` calls to the backend.

---

## Environment Variables

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `qwen` | `qwen` · `claude` · `openai` |
| `LLM_API_KEY` | — | Your API key for the chosen provider |
| `LLM_MODEL` | `qwen3.6-plus` | Model name override |
| `LLM_ENDPOINT` | *(auto)* | Custom base URL (e.g. Ollama, local LLM) |
| `BITGET_API_KEY` | — | Optional: Bitget spot account (portfolio page) |
| `BITGET_SECRET_KEY` | — | Optional: Bitget secret |
| `BITGET_PASSPHRASE` | — | Optional: Bitget passphrase |

> Bitget keys are only needed for live portfolio data. The app runs fully in demo mode without them.

---

## Architecture

```
User enters ticker (e.g. NVDA)
        │
FastAPI /debate/{ticker}
        │
Parallel async fetch
  ├── get_financials()     — yfinance: price, ratios, margins
  └── get_social_pulse()   — yfinance news + Reddit mentions
        │
Context assembled as plain text
        │
Multi-agent debate (LLM)
  ├── Bull Agent   — argues the long case
  ├── Bear Agent   — argues the short case
  └── Judge Agent  — weighs both, issues verdict
        │
Signal Engine
  └── Z-score confluence across 5 modules → BUY / HOLD / SELL / STRONG BUY / STRONG SELL
        │
Result stored in SQLite · returned to React frontend
```

**Key invariant:** The LLM writes the explanation. The confluence engine makes the decision.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/debate/{ticker}` | Full pipeline: research + Bull/Bear/Judge debate |
| `GET` | `/research/{ticker}` | Financials + social pulse only |
| `GET` | `/chart/{ticker}` | Historical price data |
| `GET` | `/analysts/{ticker}` | Analyst ratings + price targets |
| `GET` | `/earnings/{ticker}` | Upcoming earnings + history |
| `GET` | `/insiders/{ticker}` | SEC Form 4 insider transactions |
| `GET` | `/scanner` | Market scanner: price + change for preset watchlist |
| `GET` | `/whatif?ticker=AAPL&amount=1000&days_ago=30` | What-if time machine |
| `GET` | `/correlation?tickers=AAPL,MSFT,NVDA` | Correlation matrix |
| `POST` | `/chat/{ticker}` | AI chat grounded in live data |
| `POST` | `/fomo-check/{ticker}` | FOMO signal detection |
| `POST` | `/decision-save` | Save a trade decision to journal |
| `GET` | `/decision-log` | Retrieve all past decisions |
| `GET` | `/autopsy` | LLM behavioral pattern analysis |
| `GET` | `/cooldown` | Active cooldown timer status |
| `GET` | `/roast` | Claude roasts your trade history |
| `GET` | `/degen-score` | 0–100 behavioral risk score |
| `GET` | `/portfolio/assets` | Bitget spot account balances |
| `GET` | `/price/{symbol}` | Real-time price for a symbol |

---

## Tests

```bash
cd backend
python -m pytest tests/ -v
```

26 tests covering: signal engine, confluence voting, Z-score normalization, shock detection, verdict types.

---

## Project Structure

```
clearsignal/
├── backend/
│   ├── agents/
│   │   ├── chat.py             # AI chat endpoint
│   │   ├── chart_data.py       # Price history + scanner + analyst data
│   │   ├── debate.py           # Bull/Bear/Judge multi-agent debate
│   │   ├── financials.py       # yfinance fundamentals
│   │   ├── fomo_detector.py    # FOMO signal detection + regret sim
│   │   ├── social_pulse.py     # Reddit + yfinance news
│   │   ├── stock_intel.py      # Earnings, insiders, what-if, correlation
│   │   ├── ticker_utils.py     # Crypto/stock symbol normalization
│   │   └── trader.py           # Bitget trade execution + portfolio
│   ├── app/
│   │   ├── main.py             # FastAPI app + CORS
│   │   ├── routes.py           # All API routes
│   │   ├── schemas.py          # Pydantic models
│   │   ├── database.py         # SQLite trade log + decisions
│   │   ├── bitget_client.py    # Bitget MCP signal fetcher
│   │   ├── explainer.py        # LLM explanation generator
│   │   └── llm_client.py       # Provider-agnostic LLM client
│   ├── signal_engine/
│   │   └── engine.py           # Z-score normalization + confluence voting
│   └── tests/                  # 26 pytest unit tests
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx     # Landing page with feature showcase
│   │   │   ├── DeepDive.tsx    # Research + debate UI
│   │   │   ├── Portfolio.tsx   # Portfolio + smart trade tools
│   │   │   └── Decisions.tsx   # Decision journal + autopsy + cooldown
│   │   └── components/         # Shared: Navbar, MarketScanner, Watchlist, etc.
│   └── package.json
└── docs/                       # Design specs + implementation plans
```

---

## Demo

> Both backend and frontend must be running locally (see Quick Start).

1. Navigate to `http://localhost:5173`
2. Click **Research** → type `NVDA` → hit **Research & Analyze**
3. Wait ~15s for the full Bull/Bear/Judge debate to complete
4. Explore: Market Scanner → click any ticker to auto-research it
5. Navigate to **Decisions** → check your Degen Score and Cooldown Timer

---

## License

MIT
