import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from app.llm_client import LLMClient, get_llm_client


def test_get_llm_client_defaults_to_qwen():
    with patch.dict("os.environ", {"LLM_PROVIDER": "qwen", "LLM_API_KEY": "test-key"}):
        client = get_llm_client()
        assert client.provider == "qwen"
        assert client.api_key == "test-key"


def test_get_llm_client_claude():
    with patch.dict("os.environ", {"LLM_PROVIDER": "claude", "LLM_API_KEY": "sk-ant-test"}):
        client = get_llm_client()
        assert client.provider == "claude"


def test_get_llm_client_openai():
    with patch.dict("os.environ", {"LLM_PROVIDER": "openai", "LLM_API_KEY": "sk-test"}):
        client = get_llm_client()
        assert client.provider == "openai"


def test_llm_client_builds_qwen_headers():
    client = LLMClient(provider="qwen", api_key="qwen-key")
    headers = client._headers()
    assert headers["Authorization"] == "Bearer qwen-key"
    assert "Content-Type" in headers


def test_llm_client_builds_claude_headers():
    client = LLMClient(provider="claude", api_key="sk-ant-key")
    headers = client._headers()
    assert headers["x-api-key"] == "sk-ant-key"
    assert headers["anthropic-version"] == "2023-06-01"


def test_llm_client_builds_openai_headers():
    client = LLMClient(provider="openai", api_key="sk-key")
    headers = client._headers()
    assert headers["Authorization"] == "Bearer sk-key"


def test_llm_client_endpoint_qwen():
    client = LLMClient(provider="qwen", api_key="key")
    assert "dashscope" in client._endpoint()


def test_llm_client_endpoint_claude():
    client = LLMClient(provider="claude", api_key="key")
    assert "anthropic" in client._endpoint()


def test_llm_client_endpoint_openai():
    client = LLMClient(provider="openai", api_key="key")
    assert "openai" in client._endpoint()


def test_llm_client_builds_qwen_payload():
    client = LLMClient(provider="qwen", api_key="key")
    payload = client._payload("Explain this signal")
    assert payload["model"] == "qwen-plus"
    assert payload["messages"][0]["role"] == "user"
    assert "Explain this signal" in payload["messages"][0]["content"]


def test_llm_client_builds_claude_payload():
    client = LLMClient(provider="claude", api_key="key")
    payload = client._payload("Explain this signal")
    assert "claude" in payload["model"]
    assert payload["messages"][0]["content"] == "Explain this signal"


def test_llm_client_builds_openai_payload():
    client = LLMClient(provider="openai", api_key="key")
    payload = client._payload("Explain this signal")
    assert "gpt" in payload["model"]
    assert payload["messages"][0]["content"] == "Explain this signal"


def test_llm_client_custom_model_override():
    client = LLMClient(provider="qwen", api_key="key", model="qwen-turbo")
    payload = client._payload("test")
    assert payload["model"] == "qwen-turbo"


def test_llm_client_custom_endpoint_override():
    client = LLMClient(provider="openai", api_key="key", endpoint="http://localhost:11434/v1/chat/completions")
    assert client._endpoint() == "http://localhost:11434/v1/chat/completions"
