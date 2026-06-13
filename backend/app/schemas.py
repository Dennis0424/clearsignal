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
    date: str

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


class CompareResponse(BaseModel):
    ticker: str
    clearsignal_verdict: str
    clearsignal_confluence: int
    clearsignal_explanation: str | None
    llm_raw_answer: str | None


class TradeRequest(BaseModel):
    symbol: str
    side: str  # "buy" or "sell"
    quantity: float
    price: float | None = None  # None = market order
    dry_run: bool = True

    @field_validator("symbol")
    @classmethod
    def uppercase_symbol(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("side")
    @classmethod
    def validate_side(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("buy", "sell"):
            raise ValueError("side must be 'buy' or 'sell'")
        return v
