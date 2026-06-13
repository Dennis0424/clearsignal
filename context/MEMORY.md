<!-- Cap: 2,500 chars. Agent maintains via memory-write instructions. -->
# Working Memory

## Active Threads

- Plans 1–5: COMPLETE (26→65 tests, committed through 6f75026)
- Multi-Agent Upgrade (v2): IN PROGRESS — spec at docs/superpowers/specs/2026-06-12-multi-agent-upgrade.md
  - `backend/agents/financials.py` — DONE (yfinance)
  - `backend/agents/social_pulse.py` — DONE (Reddit JSON + yfinance news)
  - `backend/agents/debate.py` — DONE (Bull/Bear/Judge sequential LLM)
  - `/research/{ticker}` + `/debate/{ticker}` endpoints — DONE in routes.py
  - Frontend "Deep Dive" page — DONE (chart + financials + social + debate + trade + AI chat)
  - `backend/agents/trader.py` — DONE (Bitget REST API direct, HMAC signing)
  - `backend/agents/chart_data.py` — DONE (yfinance price history + analyst data)
  - `backend/agents/chat.py` — DONE (LLM chat with stock data context)
  - `backend/agents/fomo_detector.py` — DONE (FOMO check + regret sim + LLM warning)
  - Decision Autopsy: /fomo-check, /decision, /decisions, /autopsy — DONE
  - Endpoints: /research, /debate, /trade, /chart, /analysts, /chat, /fomo-check, /decision, /decisions, /autopsy
  - 71 tests pass, frontend build clean
  - UI redesigned: Modern Dark Cinema + gold/purple, glassmorphism, Recharts
- Qwen endpoint: hackathon.bitgetops.com, model: qwen3.6-plus
- Bitget API keys configured in .env (api key + secret + passphrase)

## Environment Notes

- Python 3.12.10 in `.venv/`
- pytest 9.0.3 installed
- Git repo initialized, master branch
- Activate: `source .venv/Scripts/activate`

## Pending Decisions

- Bitget MCP ticker coverage — need to verify during Plan 2
- ChatGPT comparison: cache responses vs live call (cache safer for demo)
- Replay mode: does Bitget provide historical snapshots?
