from app.llm_client import get_llm_client
from agents.financials import get_financials, format_financials_for_prompt
from agents.social_pulse import get_social_pulse, format_social_for_prompt

SYSTEM_PROMPT = """You are ClearSignal AI, a concise and opinionated stock research assistant.
You have access to real financial data and social signals for the stock the user is asking about.
Answer questions directly with data-backed reasoning. Be specific. Cite numbers.
If you don't know something, say so. Keep answers under 200 words unless more detail is needed.

{context}"""


async def chat_about_stock(ticker: str, question: str) -> str:
    """Answer a user question about a stock with full data context."""
    financials = get_financials(ticker)
    social = get_social_pulse(ticker)

    context = format_financials_for_prompt(financials) + "\n\n" + format_social_for_prompt(social)
    full_prompt = SYSTEM_PROMPT.format(context=context) + f"\n\nUser question: {question}"

    llm = get_llm_client()
    return await llm.complete(full_prompt)
