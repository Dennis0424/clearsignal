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
