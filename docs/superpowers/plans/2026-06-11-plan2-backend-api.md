# Backend API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the FastAPI backend with endpoints for live analysis and replay mode, SQLite sim trade log, and Bitget MCP tool integration.

**Architecture:** FastAPI app with 3 endpoints (`/analyze`, `/replay`, `/history`). A `bitget_client.py` module calls the 5 Bitget MCP tools via subprocess (`npx bitget-hub`), parses responses into `SignalInput` objects, and feeds them to the signal engine. Results are persisted in SQLite.

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, httpx, SQLite (via stdlib sqlite3), pytest, pytest-asyncio

---

## File Structure

```
backend/
├── signal_engine/          # (existing from Plan 1)
├── app/
│   ├── __init__.py
│   ├── main.py             # FastAPI app + CORS
│   ├── routes.py           # /analyze, /replay, /history endpoints
│   ├── schemas.py          # Pydantic request/response models
│   ├── database.py         # SQLite connection + trade log table
│   └── bitget_client.py    # Calls Bitget MCP tools, returns SignalInput list
├── tests/
│   ├── test_models.py      # (existing)
│   ├── test_normalizer.py  # (existing)
│   ├── test_voter.py       # (existing)
│   ├── test_engine.py      # (existing)
│   ├── test_schemas.py
│   ├── test_database.py
│   ├── test_routes.py
│   └── test_bitget_client.py
├── pyproject.toml           # (update with new deps)
└── requirements.txt         # Pinned deps for deployment
```

---

### Task 1: Dependencies & Project Setup

**Files:**
- Modify: `backend/pyproject.toml`
- Create: `backend/requirements.txt`

- [ ] **Step 1: Update pyproject.toml with dependencies**

```toml
# backend/pyproject.toml
[project]
name = "clearsignal-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115",
    "uvicorn>=0.30",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-asyncio>=0.23",
    "httpx>=0.27",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
asyncio_mode = "auto"
```

- [ ] **Step 2: Create requirements.txt**

```
fastapi>=0.115
uvicorn>=0.30
pydantic>=2.0
```

- [ ] **Step 3: Install dependencies**

Run: `cd backend && source ../.venv/Scripts/activate && pip install -e ".[dev]" -q`
Expected: Installs without error

- [ ] **Step 4: Verify existing tests still pass**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All 26 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/requirements.txt
git commit -m "chore: add FastAPI dependencies"
```

---

### Task 2: Pydantic Schemas

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/schemas.py`
- Create: `backend/tests/test_schemas.py`

- [ ] **Step 1: Create app package**

```bash
mkdir -p backend/app
touch backend/app/__init__.py
```

- [ ] **Step 2: Write failing tests**

```python
# backend/tests/test_schemas.py
from app.schemas import AnalyzeRequest, AnalyzeResponse, ModuleScoreResponse, TradeLogEntry


def test_analyze_request_valid():
    req = AnalyzeRequest(ticker="AAPL")
    assert req.ticker == "AAPL"


def test_analyze_request_uppercase():
    req = AnalyzeRequest(ticker="aapl")
    assert req.ticker == "AAPL"


def test_analyze_response_structure():
    resp = AnalyzeResponse(
        ticker="AAPL",
        verdict="BUY",
        confluence_count=4,
        total_modules=5,
        shock_detected=False,
        scores=[
            ModuleScoreResponse(
                module_name="technical-analysis",
                z_score=1.5,
                vote="bullish",
            )
        ],
        explanation=None,
    )
    assert resp.verdict == "BUY"
    assert resp.scores[0].z_score == 1.5


def test_trade_log_entry():
    entry = TradeLogEntry(
        id=1,
        timestamp="2026-06-11T12:00:00",
        ticker="AAPL",
        verdict="BUY",
        confluence_count=4,
        total_modules=5,
        shock_detected=False,
    )
    assert entry.ticker == "AAPL"
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_schemas.py -v`
Expected: FAIL with import error

- [ ] **Step 4: Write implementation**

```python
# backend/app/schemas.py
from pydantic import BaseModel, field_validator


class AnalyzeRequest(BaseModel):
    ticker: str

    @field_validator("ticker")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return v.strip().upper()


class ModuleScoreResponse(BaseModel):
    module_name: str
    z_score: float
    vote: str


class AnalyzeResponse(BaseModel):
    ticker: str
    verdict: str
    confluence_count: int
    total_modules: int
    shock_detected: bool
    scores: list[ModuleScoreResponse]
    explanation: str | None = None


class ReplayRequest(BaseModel):
    ticker: str
    date: str  # ISO format YYYY-MM-DD

    @field_validator("ticker")
    @classmethod
    def uppercase_ticker(cls, v: str) -> str:
        return v.strip().upper()


class TradeLogEntry(BaseModel):
    id: int
    timestamp: str
    ticker: str
    verdict: str
    confluence_count: int
    total_modules: int
    shock_detected: bool
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_schemas.py -v`
Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/ backend/tests/test_schemas.py
git commit -m "feat: add Pydantic request/response schemas"
```

---

### Task 3: SQLite Database

**Files:**
- Create: `backend/app/database.py`
- Create: `backend/tests/test_database.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_database.py
import os
import tempfile
from app.database import Database


def test_create_tables():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        # Verify table exists by inserting
        db.log_trade(
            ticker="AAPL",
            verdict="BUY",
            confluence_count=4,
            total_modules=5,
            shock_detected=False,
            scores_json='[]',
        )
        entries = db.get_history()
        assert len(entries) == 1
        assert entries[0]["ticker"] == "AAPL"
    finally:
        os.unlink(db_path)


def test_get_history_empty():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        entries = db.get_history()
        assert entries == []
    finally:
        os.unlink(db_path)


def test_get_history_ordered_newest_first():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        db.log_trade("AAPL", "BUY", 4, 5, False, '[]')
        db.log_trade("TSLA", "SELL", 4, 5, False, '[]')
        entries = db.get_history()
        assert len(entries) == 2
        assert entries[0]["ticker"] == "TSLA"  # newest first
    finally:
        os.unlink(db_path)


def test_get_history_by_ticker():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        db = Database(db_path)
        db.create_tables()
        db.log_trade("AAPL", "BUY", 4, 5, False, '[]')
        db.log_trade("TSLA", "SELL", 4, 5, False, '[]')
        db.log_trade("AAPL", "HOLD", 3, 5, False, '[]')
        entries = db.get_history(ticker="AAPL")
        assert len(entries) == 2
        assert all(e["ticker"] == "AAPL" for e in entries)
    finally:
        os.unlink(db_path)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_database.py -v`
Expected: FAIL with import error

- [ ] **Step 3: Write implementation**

```python
# backend/app/database.py
import sqlite3
from datetime import datetime, timezone


class Database:
    def __init__(self, db_path: str = "trades.db"):
        self.db_path = db_path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def create_tables(self):
        conn = self._connect()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS trade_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ticker TEXT NOT NULL,
                verdict TEXT NOT NULL,
                confluence_count INTEGER NOT NULL,
                total_modules INTEGER NOT NULL,
                shock_detected INTEGER NOT NULL,
                scores_json TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()

    def log_trade(
        self,
        ticker: str,
        verdict: str,
        confluence_count: int,
        total_modules: int,
        shock_detected: bool,
        scores_json: str,
    ) -> int:
        conn = self._connect()
        cursor = conn.execute(
            """
            INSERT INTO trade_log (timestamp, ticker, verdict, confluence_count, total_modules, shock_detected, scores_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                ticker,
                verdict,
                confluence_count,
                total_modules,
                int(shock_detected),
                scores_json,
            ),
        )
        conn.commit()
        row_id = cursor.lastrowid
        conn.close()
        return row_id

    def get_history(self, ticker: str | None = None, limit: int = 100) -> list[dict]:
        conn = self._connect()
        if ticker:
            rows = conn.execute(
                "SELECT * FROM trade_log WHERE ticker = ? ORDER BY id DESC LIMIT ?",
                (ticker, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM trade_log ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        conn.close()
        return [dict(row) for row in rows]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_database.py -v`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/database.py backend/tests/test_database.py
git commit -m "feat: add SQLite trade log database"
```

---

### Task 4: Bitget MCP Client (Mock-Ready)

**Files:**
- Create: `backend/app/bitget_client.py`
- Create: `backend/tests/test_bitget_client.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_bitget_client.py
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
    assert result.historical_std == 10.0  # default


def test_parse_module_response_zero_std_defaults():
    raw = {
        "module": "macro-analyst",
        "value": 55.0,
        "mean": 50.0,
        "std": 0.0,
    }
    result = parse_module_response(raw)
    assert result.historical_std == 10.0  # fallback to prevent div-by-zero
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_bitget_client.py -v`
Expected: FAIL with import error

- [ ] **Step 3: Write implementation**

```python
# backend/app/bitget_client.py
import asyncio
import json
import subprocess
from signal_engine.models import SignalInput

MODULES = [
    "technical-analysis",
    "sentiment-analyst",
    "macro-analyst",
    "news-briefing",
    "market-intel",
]

DEFAULT_STD = 10.0


def parse_module_response(raw: dict) -> SignalInput:
    std = raw.get("std", 0.0)
    if std == 0.0:
        std = DEFAULT_STD
    return SignalInput(
        module_name=raw["module"],
        raw_value=raw["value"],
        historical_mean=raw["mean"],
        historical_std=std,
    )


async def call_module(module: str, ticker: str) -> dict:
    """Call a single Bitget MCP module via npx bitget-hub."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "npx", "bitget-hub", module, "--ticker", ticker,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30)
        return json.loads(stdout.decode())
    except (asyncio.TimeoutError, json.JSONDecodeError, FileNotFoundError):
        # Fallback: return neutral signal
        return {
            "module": module,
            "value": 50.0,
            "mean": 50.0,
            "std": DEFAULT_STD,
        }


async def fetch_all_signals(ticker: str) -> list[SignalInput]:
    """Call all 5 Bitget modules in parallel and return SignalInputs."""
    tasks = [call_module(module, ticker) for module in MODULES]
    results = await asyncio.gather(*tasks)
    return [parse_module_response(r) for r in results]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_bitget_client.py -v`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/bitget_client.py backend/tests/test_bitget_client.py
git commit -m "feat: add Bitget MCP client with fallback"
```

---

### Task 5: FastAPI Routes

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/routes.py`
- Create: `backend/tests/test_routes.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_routes.py
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from app.main import app
from signal_engine.models import SignalInput


def _mock_signals():
    return [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),
        SignalInput("macro-analyst", 68.0, 50.0, 10.0),
        SignalInput("news-briefing", 70.0, 50.0, 10.0),
        SignalInput("market-intel", 65.0, 50.0, 10.0),
    ]


@pytest.mark.asyncio
async def test_analyze_endpoint():
    with patch("app.routes.fetch_all_signals", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = _mock_signals()
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/analyze", json={"ticker": "AAPL"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["ticker"] == "AAPL"
        assert data["verdict"] == "STRONG_BUY"
        assert data["confluence_count"] == 5
        assert len(data["scores"]) == 5


@pytest.mark.asyncio
async def test_analyze_endpoint_hold():
    signals = [
        SignalInput("technical-analysis", 55.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 55.0, 50.0, 10.0),
        SignalInput("macro-analyst", 52.0, 50.0, 10.0),
        SignalInput("news-briefing", 48.0, 50.0, 10.0),
        SignalInput("market-intel", 51.0, 50.0, 10.0),
    ]
    with patch("app.routes.fetch_all_signals", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = signals
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.post("/analyze", json={"ticker": "TSLA"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "HOLD"


@pytest.mark.asyncio
async def test_history_endpoint_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/history")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_routes.py -v`
Expected: FAIL with import error

- [ ] **Step 3: Write routes implementation**

```python
# backend/app/routes.py
import json
from fastapi import APIRouter
from app.schemas import AnalyzeRequest, AnalyzeResponse, ModuleScoreResponse, TradeLogEntry
from app.database import Database
from app.bitget_client import fetch_all_signals
from signal_engine.engine import analyze

router = APIRouter()
db = Database("trades.db")
db.create_tables()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_ticker(request: AnalyzeRequest):
    signals = await fetch_all_signals(request.ticker)
    verdict = analyze(signals)

    scores_response = [
        ModuleScoreResponse(
            module_name=s.module_name,
            z_score=s.z_score,
            vote=s.vote,
        )
        for s in verdict.scores
    ]

    scores_json = json.dumps([s.model_dump() for s in scores_response])
    db.log_trade(
        ticker=request.ticker,
        verdict=verdict.verdict_type.value,
        confluence_count=verdict.confluence_count,
        total_modules=verdict.total_modules,
        shock_detected=verdict.shock_detected,
        scores_json=scores_json,
    )

    return AnalyzeResponse(
        ticker=request.ticker,
        verdict=verdict.verdict_type.value,
        confluence_count=verdict.confluence_count,
        total_modules=verdict.total_modules,
        shock_detected=verdict.shock_detected,
        scores=scores_response,
        explanation=None,
    )


@router.get("/history")
async def get_history(ticker: str | None = None):
    entries = db.get_history(ticker=ticker)
    return entries
```

- [ ] **Step 4: Write main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

app = FastAPI(title="ClearSignal API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_routes.py -v`
Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/main.py backend/app/routes.py backend/tests/test_routes.py
git commit -m "feat: add FastAPI routes for /analyze and /history"
```

---

### Task 6: Full Suite Verification & Commit

- [ ] **Step 1: Run entire test suite**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests PASS (26 existing + new ones)

- [ ] **Step 2: Test server starts**

Run: `cd backend && timeout 5 python -m uvicorn app.main:app --port 8000 2>&1 || true`
Expected: Server starts without error

- [ ] **Step 3: Final commit if anything unstaged**

```bash
git add -A && git status
# Only commit if there are changes
git diff --cached --quiet || git commit -m "chore: Plan 2 complete — backend API with FastAPI + SQLite"
```

---

### Task 7: Update Memory

- [ ] **Step 1: Update context/MEMORY.md**

Update Plan 2 status to COMPLETE with test count and commit hash.

- [ ] **Step 2: Update Claude persistent memory**

Update `build_progress.md` with Plan 2 completion date.

---

## Done Criteria

After completing all tasks:
- FastAPI app starts and serves `/analyze` and `/history`
- Bitget client calls modules in parallel with graceful fallback
- SQLite logs every analysis result
- All tests pass (existing 26 + new)
- CORS enabled for frontend
