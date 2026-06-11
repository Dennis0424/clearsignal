# CLAUDE.md — ClearSignal

## Project

ClearSignal: Deterministic US stock signal engine for Bitget Hackathon S1 (Track 3).
Deadline: 2026-06-25.

**Stack:** Python 3.11+ (FastAPI), React + Tailwind, SQLite, Claude API, Bitget MCP tools (`npx bitget-hub`).

## Environment

- Activate venv before any Python command: `source .venv/Scripts/activate`
- Backend lives in `backend/`
- Frontend lives in `frontend/`
- Run backend tests: `cd backend && python -m pytest tests/ -v`
- Design spec: `docs/superpowers/specs/2026-06-10-clearsignal-design.md`
- Plans: `docs/superpowers/plans/`

## Coding Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### Think Before Coding

- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### Simplicity First

- No features beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### Surgical Changes

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style.
- Remove imports/variables that YOUR changes made unused.

### Goal-Driven Execution

- Transform tasks into verifiable goals.
- TDD: write test first, then make it pass.
- Run tests after every change. Don't commit red.
