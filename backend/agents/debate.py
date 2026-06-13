from app.llm_client import get_llm_client

BULL_PROMPT = """You are a senior equity analyst BULL. Your job is to make the STRONGEST possible \
case for BUYING {ticker}. Use the provided data — financial metrics, social sentiment, \
and technical signals — to argue your position. Be specific. Cite numbers.
Max 150 words.

Context:
{context}"""

BEAR_PROMPT = """You are a senior equity analyst BEAR. You've just read the Bull's argument below.
Your job is to make the STRONGEST possible case AGAINST buying {ticker}.
Attack the Bull's specific claims using the data. Find risks they ignored.
Max 150 words.

Context:
{context}

Bull's argument:
{bull_response}"""

JUDGE_PROMPT = """You are a neutral senior portfolio manager judging this debate about {ticker}.
Read both arguments. Decide which side made a stronger case and why.
Award a confidence score (1-10) for each side. State your final recommendation.
Be concise. Max 100 words.

Context:
{context}

Bull: {bull_response}
Bear: {bear_response}"""


async def run_debate(ticker: str, context: str) -> dict:
    """Run Bull -> Bear -> Judge debate sequentially. Each sees the previous output."""
    llm = get_llm_client()

    bull_response = await llm.complete(
        BULL_PROMPT.format(ticker=ticker, context=context)
    )

    bear_response = await llm.complete(
        BEAR_PROMPT.format(ticker=ticker, context=context, bull_response=bull_response)
    )

    judge_response = await llm.complete(
        JUDGE_PROMPT.format(
            ticker=ticker, context=context,
            bull_response=bull_response, bear_response=bear_response,
        )
    )

    return {
        "ticker": ticker,
        "bull": bull_response,
        "bear": bear_response,
        "judge": judge_response,
    }
