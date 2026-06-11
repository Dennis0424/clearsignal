import asyncio
import json
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
    try:
        proc = await asyncio.create_subprocess_exec(
            "npx", "bitget-hub", module, "--ticker", ticker,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30)
        return json.loads(stdout.decode())
    except (asyncio.TimeoutError, json.JSONDecodeError, FileNotFoundError, OSError):
        return {
            "module": module,
            "value": 50.0,
            "mean": 50.0,
            "std": DEFAULT_STD,
        }


async def fetch_all_signals(ticker: str) -> list[SignalInput]:
    tasks = [call_module(module, ticker) for module in MODULES]
    results = await asyncio.gather(*tasks)
    return [parse_module_response(r) for r in results]
