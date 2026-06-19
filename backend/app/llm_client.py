import os
import httpx

PROVIDER_CONFIGS = {
    "qwen": {
        "endpoint": "https://hackathon.bitgetops.com/v1/chat/completions",
        "model": "qwen3.6-plus",
    },
    "claude": {
        "endpoint": "https://api.anthropic.com/v1/messages",
        "model": "claude-sonnet-4-20250514",
    },
    "openai": {
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4o-mini",
    },
}


class LLMClient:
    def __init__(
        self,
        provider: str,
        api_key: str,
        model: str | None = None,
        endpoint: str | None = None,
    ):
        self.provider = provider
        self.api_key = api_key
        self.model = model or PROVIDER_CONFIGS.get(provider, {}).get("model", "gpt-4o-mini")
        self._custom_endpoint = endpoint

    def _endpoint(self) -> str:
        if self._custom_endpoint:
            return self._custom_endpoint
        return PROVIDER_CONFIGS.get(self.provider, {}).get(
            "endpoint", "https://api.openai.com/v1/chat/completions"
        )

    def _headers(self) -> dict:
        if self.provider == "claude":
            return {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _payload(self, prompt: str) -> dict:
        if self.provider == "claude":
            return {
                "model": self.model,
                "max_tokens": 512,
                "messages": [{"role": "user", "content": prompt}],
            }
        payload = {
            "model": self.model,
            "max_tokens": 512,
            "messages": [{"role": "user", "content": prompt}],
        }
        # Disable chain-of-thought reasoning on Qwen3 thinking models — cuts latency from ~120s to ~3s
        if self.provider == "qwen":
            payload["enable_thinking"] = False
        return payload

    async def complete(self, prompt: str, retries: int = 2) -> str:
        last_err = None
        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.post(
                        self._endpoint(),
                        headers=self._headers(),
                        json=self._payload(prompt),
                    )
                    resp.raise_for_status()
                    data = resp.json()

                if self.provider == "claude":
                    return data["content"][0]["text"]
                return data["choices"][0]["message"]["content"]
            except (httpx.ConnectError, httpx.ReadTimeout, httpx.ConnectTimeout) as e:
                last_err = e
                if attempt < retries:
                    import asyncio
                    await asyncio.sleep(1)
                    continue
                raise
            except Exception:
                raise
        raise last_err  # type: ignore


def get_llm_client() -> LLMClient:
    provider = os.environ.get("LLM_PROVIDER", "qwen").lower()
    api_key = os.environ.get("LLM_API_KEY", "")
    model = os.environ.get("LLM_MODEL")
    endpoint = os.environ.get("LLM_ENDPOINT")
    return LLMClient(provider=provider, api_key=api_key, model=model, endpoint=endpoint)
