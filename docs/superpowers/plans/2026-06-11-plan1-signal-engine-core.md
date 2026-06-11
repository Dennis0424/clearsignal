# Signal Engine Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic signal scoring engine — Z-score normalization + confluence voting — with no external dependencies beyond Python stdlib + pytest.

**Architecture:** Pure Python module with two components: a `ZScoreNormalizer` that converts raw signal values into standardized scores, and a `ConfluenceVoter` that tallies votes across modules and emits a verdict. Both are stateless functions operating on data classes.

**Tech Stack:** Python 3.11+, pytest, dataclasses

---

## File Structure

```
backend/
├── signal_engine/
│   ├── __init__.py
│   ├── models.py          # Data classes: SignalInput, ModuleScore, Verdict
│   ├── normalizer.py      # Z-score normalization logic
│   ├── voter.py           # Confluence voting logic
│   └── engine.py          # Orchestrator: takes raw inputs → returns Verdict
├── tests/
│   ├── __init__.py
│   ├── test_normalizer.py
│   ├── test_voter.py
│   └── test_engine.py
└── pyproject.toml
```

---

### Task 1: Data Models

**Files:**
- Create: `backend/signal_engine/__init__.py`
- Create: `backend/signal_engine/models.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_models.py`

- [ ] **Step 1: Create package structure**

```bash
mkdir -p backend/signal_engine backend/tests
touch backend/signal_engine/__init__.py backend/tests/__init__.py
```

- [ ] **Step 2: Write the failing test**

```python
# backend/tests/test_models.py
from signal_engine.models import SignalInput, ModuleScore, Verdict, VerdictType


def test_signal_input_creation():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=72.5,
        historical_mean=50.0,
        historical_std=10.0,
    )
    assert sig.module_name == "technical-analysis"
    assert sig.raw_value == 72.5


def test_module_score_vote_bullish():
    score = ModuleScore(module_name="technical-analysis", z_score=1.5, vote="bullish")
    assert score.vote == "bullish"


def test_module_score_vote_bearish():
    score = ModuleScore(module_name="sentiment-analyst", z_score=-1.3, vote="bearish")
    assert score.vote == "bearish"


def test_module_score_vote_neutral():
    score = ModuleScore(module_name="macro-analyst", z_score=0.4, vote="neutral")
    assert score.vote == "neutral"


def test_verdict_creation():
    verdict = Verdict(
        verdict_type=VerdictType.BUY,
        confluence_count=4,
        total_modules=5,
        scores=[],
        shock_detected=False,
    )
    assert verdict.verdict_type == VerdictType.BUY
    assert verdict.confluence_count == 4
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'signal_engine.models'`

- [ ] **Step 4: Write minimal implementation**

```python
# backend/signal_engine/models.py
from dataclasses import dataclass
from enum import Enum
from typing import List


class VerdictType(Enum):
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    HOLD = "HOLD"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"


@dataclass
class SignalInput:
    module_name: str
    raw_value: float
    historical_mean: float
    historical_std: float


@dataclass
class ModuleScore:
    module_name: str
    z_score: float
    vote: str  # "bullish", "bearish", "neutral"


@dataclass
class Verdict:
    verdict_type: VerdictType
    confluence_count: int
    total_modules: int
    scores: List[ModuleScore]
    shock_detected: bool
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_models.py -v`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/signal_engine/ backend/tests/
git commit -m "feat: add signal engine data models"
```

---

### Task 2: Z-Score Normalizer

**Files:**
- Create: `backend/signal_engine/normalizer.py`
- Create: `backend/tests/test_normalizer.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_normalizer.py
from signal_engine.models import SignalInput, ModuleScore
from signal_engine.normalizer import normalize


def test_normalize_bullish():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=72.5,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert isinstance(result, ModuleScore)
    assert result.z_score == 2.0  # clamped from 2.25
    assert result.vote == "bullish"


def test_normalize_bearish():
    sig = SignalInput(
        module_name="sentiment-analyst",
        raw_value=30.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == -2.0
    assert result.vote == "bearish"


def test_normalize_neutral():
    sig = SignalInput(
        module_name="macro-analyst",
        raw_value=52.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == 0.2
    assert result.vote == "neutral"


def test_normalize_exact_threshold_bullish():
    sig = SignalInput(
        module_name="news-briefing",
        raw_value=60.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == 1.0
    assert result.vote == "neutral"  # z == 1.0 is NOT bullish (must be > 1.0)


def test_normalize_exact_threshold_bearish():
    sig = SignalInput(
        module_name="market-intel",
        raw_value=40.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == -1.0
    assert result.vote == "neutral"  # z == -1.0 is NOT bearish (must be < -1.0)


def test_normalize_zero_std_returns_neutral():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=50.0,
        historical_mean=50.0,
        historical_std=0.0,
    )
    result = normalize(sig)
    assert result.z_score == 0.0
    assert result.vote == "neutral"


def test_normalize_clamps_positive():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=100.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == 2.0
    assert result.vote == "bullish"


def test_normalize_clamps_negative():
    sig = SignalInput(
        module_name="technical-analysis",
        raw_value=0.0,
        historical_mean=50.0,
        historical_std=10.0,
    )
    result = normalize(sig)
    assert result.z_score == -2.0
    assert result.vote == "bearish"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_normalizer.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'signal_engine.normalizer'`

- [ ] **Step 3: Write minimal implementation**

```python
# backend/signal_engine/normalizer.py
from signal_engine.models import SignalInput, ModuleScore

BULLISH_THRESHOLD = 1.0
BEARISH_THRESHOLD = -1.0
MAX_Z = 2.0
MIN_Z = -2.0


def normalize(signal: SignalInput) -> ModuleScore:
    if signal.historical_std == 0.0:
        z = 0.0
    else:
        z = (signal.raw_value - signal.historical_mean) / signal.historical_std

    z = max(MIN_Z, min(MAX_Z, z))

    if z > BULLISH_THRESHOLD:
        vote = "bullish"
    elif z < BEARISH_THRESHOLD:
        vote = "bearish"
    else:
        vote = "neutral"

    return ModuleScore(module_name=signal.module_name, z_score=z, vote=vote)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_normalizer.py -v`
Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/signal_engine/normalizer.py backend/tests/test_normalizer.py
git commit -m "feat: add Z-score normalizer with clamping"
```

---

### Task 3: Confluence Voter

**Files:**
- Create: `backend/signal_engine/voter.py`
- Create: `backend/tests/test_voter.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_voter.py
from signal_engine.models import ModuleScore, VerdictType
from signal_engine.voter import vote

MODULES = [
    "technical-analysis",
    "sentiment-analyst",
    "macro-analyst",
    "news-briefing",
    "market-intel",
]


def _make_scores(votes: list[str]) -> list[ModuleScore]:
    return [
        ModuleScore(
            module_name=MODULES[i],
            z_score=1.5 if v == "bullish" else -1.5 if v == "bearish" else 0.0,
            vote=v,
        )
        for i, v in enumerate(votes)
    ]


def test_strong_buy_5_of_5():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "bullish"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.STRONG_BUY
    assert result.confluence_count == 5


def test_buy_4_of_5():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.BUY
    assert result.confluence_count == 4


def test_hold_3_of_5():
    scores = _make_scores(["bullish", "bullish", "bullish", "neutral", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.HOLD
    assert result.confluence_count == 3


def test_hold_mixed():
    scores = _make_scores(["bullish", "bullish", "bearish", "bearish", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.HOLD


def test_sell_4_of_5():
    scores = _make_scores(["bearish", "bearish", "bearish", "bearish", "neutral"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.SELL
    assert result.confluence_count == 4


def test_strong_sell_5_of_5():
    scores = _make_scores(["bearish", "bearish", "bearish", "bearish", "bearish"])
    result = vote(scores)
    assert result.verdict_type == VerdictType.STRONG_SELL
    assert result.confluence_count == 5


def test_shock_detected_macro():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "neutral"])
    scores[2] = ModuleScore(module_name="macro-analyst", z_score=-2.0, vote="bearish")
    result = vote(scores)
    assert result.shock_detected is True


def test_shock_detected_news():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "neutral"])
    scores[3] = ModuleScore(module_name="news-briefing", z_score=-2.0, vote="bearish")
    result = vote(scores)
    assert result.shock_detected is True


def test_no_shock_normal_conditions():
    scores = _make_scores(["bullish", "bullish", "bullish", "bullish", "bullish"])
    result = vote(scores)
    assert result.shock_detected is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_voter.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'signal_engine.voter'`

- [ ] **Step 3: Write minimal implementation**

```python
# backend/signal_engine/voter.py
from signal_engine.models import ModuleScore, Verdict, VerdictType

SHOCK_MODULES = {"macro-analyst", "news-briefing"}
SHOCK_THRESHOLD = -2.0


def vote(scores: list[ModuleScore]) -> Verdict:
    bullish_count = sum(1 for s in scores if s.vote == "bullish")
    bearish_count = sum(1 for s in scores if s.vote == "bearish")

    if bullish_count == 5:
        verdict_type = VerdictType.STRONG_BUY
        confluence = 5
    elif bullish_count >= 4:
        verdict_type = VerdictType.BUY
        confluence = bullish_count
    elif bearish_count == 5:
        verdict_type = VerdictType.STRONG_SELL
        confluence = 5
    elif bearish_count >= 4:
        verdict_type = VerdictType.SELL
        confluence = bearish_count
    else:
        verdict_type = VerdictType.HOLD
        confluence = max(bullish_count, bearish_count)

    shock_detected = any(
        s.z_score <= SHOCK_THRESHOLD
        for s in scores
        if s.module_name in SHOCK_MODULES
    )

    return Verdict(
        verdict_type=verdict_type,
        confluence_count=confluence,
        total_modules=len(scores),
        scores=scores,
        shock_detected=shock_detected,
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_voter.py -v`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/signal_engine/voter.py backend/tests/test_voter.py
git commit -m "feat: add confluence voter with shock detection"
```

---

### Task 4: Engine Orchestrator

**Files:**
- Create: `backend/signal_engine/engine.py`
- Create: `backend/tests/test_engine.py`

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_engine.py
from signal_engine.models import SignalInput, VerdictType
from signal_engine.engine import analyze


def test_analyze_all_bullish():
    inputs = [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),
        SignalInput("macro-analyst", 68.0, 50.0, 10.0),
        SignalInput("news-briefing", 70.0, 50.0, 10.0),
        SignalInput("market-intel", 65.0, 50.0, 10.0),
    ]
    verdict = analyze(inputs)
    assert verdict.verdict_type == VerdictType.STRONG_BUY
    assert verdict.confluence_count == 5
    assert len(verdict.scores) == 5
    assert verdict.shock_detected is False


def test_analyze_mixed_hold():
    inputs = [
        SignalInput("technical-analysis", 55.0, 50.0, 10.0),  # z=0.5 neutral
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),   # z=2.0 bullish (clamped)
        SignalInput("macro-analyst", 52.0, 50.0, 10.0),       # z=0.2 neutral
        SignalInput("news-briefing", 48.0, 50.0, 10.0),       # z=-0.2 neutral
        SignalInput("market-intel", 65.0, 50.0, 10.0),        # z=1.5 bullish (clamped to 2.0? no, 1.5)
    ]
    verdict = analyze(inputs)
    assert verdict.verdict_type == VerdictType.HOLD


def test_analyze_with_shock():
    inputs = [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),
        SignalInput("sentiment-analyst", 75.0, 50.0, 10.0),
        SignalInput("macro-analyst", 20.0, 50.0, 10.0),  # z=-3.0 clamped to -2.0 → shock
        SignalInput("news-briefing", 70.0, 50.0, 10.0),
        SignalInput("market-intel", 65.0, 50.0, 10.0),
    ]
    verdict = analyze(inputs)
    assert verdict.shock_detected is True


def test_analyze_returns_correct_z_scores():
    inputs = [
        SignalInput("technical-analysis", 72.0, 50.0, 10.0),  # z=2.0 clamped
        SignalInput("sentiment-analyst", 30.0, 50.0, 10.0),   # z=-2.0
        SignalInput("macro-analyst", 50.0, 50.0, 10.0),       # z=0.0
        SignalInput("news-briefing", 50.0, 50.0, 10.0),       # z=0.0
        SignalInput("market-intel", 50.0, 50.0, 10.0),        # z=0.0
    ]
    verdict = analyze(inputs)
    scores_by_name = {s.module_name: s for s in verdict.scores}
    assert scores_by_name["technical-analysis"].z_score == 2.0
    assert scores_by_name["sentiment-analyst"].z_score == -2.0
    assert scores_by_name["macro-analyst"].z_score == 0.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_engine.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'signal_engine.engine'`

- [ ] **Step 3: Write minimal implementation**

```python
# backend/signal_engine/engine.py
from signal_engine.models import SignalInput, Verdict
from signal_engine.normalizer import normalize
from signal_engine.voter import vote


def analyze(inputs: list[SignalInput]) -> Verdict:
    scores = [normalize(sig) for sig in inputs]
    return vote(scores)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_engine.py -v`
Expected: All 4 tests PASS

- [ ] **Step 5: Run full test suite**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All 26 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/signal_engine/engine.py backend/tests/test_engine.py
git commit -m "feat: add engine orchestrator combining normalizer + voter"
```

---

### Task 5: Package Config

**Files:**
- Create: `backend/pyproject.toml`

- [ ] **Step 1: Create pyproject.toml**

```toml
# backend/pyproject.toml
[project]
name = "clearsignal-backend"
version = "0.1.0"
requires-python = ">=3.11"

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

- [ ] **Step 2: Install and run full suite**

Run: `cd backend && pip install -e ".[dev]" 2>/dev/null; python -m pytest tests/ -v`
Expected: All 26 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/pyproject.toml
git commit -m "chore: add pyproject.toml with pytest config"
```

---

## Done Criteria

After completing all 5 tasks:
- 4 source files in `backend/signal_engine/`
- 4 test files in `backend/tests/`
- 26 passing tests
- Fully deterministic: same inputs → same verdict, every time
- Zero external dependencies beyond pytest for dev
