"""Tests for copilot/client.py."""

from __future__ import annotations

import json
import pytest
import httpx
import respx

from copilot.client import CopilotClient, CopilotAPIError


API_URL = "https://api.githubcopilot.com"
COMPLETIONS_URL = f"{API_URL}/chat/completions"


def _sse_line(data: dict) -> str:
    return f"data: {json.dumps(data)}\n"


@pytest.fixture
def client():
    return CopilotClient(github_token="test-token", api_url=API_URL)


# ---------------------------------------------------------------------------
# chat()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_chat_success(client):
    """chat() returns the assistant message content on 200 OK."""
    response_body = {
        "choices": [{"message": {"role": "assistant", "content": "Hello from Copilot!"}}]
    }
    with respx.mock:
        respx.post(COMPLETIONS_URL).mock(
            return_value=httpx.Response(200, json=response_body)
        )
        result = await client.chat("Hi", history=[])

    assert result == "Hello from Copilot!"


@pytest.mark.asyncio
async def test_chat_with_history(client):
    """chat() includes prior history in the request messages."""
    history = [
        {"role": "user", "content": "What is Python?"},
        {"role": "assistant", "content": "A programming language."},
    ]
    response_body = {
        "choices": [{"message": {"role": "assistant", "content": "Follow-up answer."}}]
    }
    captured = {}

    def capture_request(request: httpx.Request) -> httpx.Response:
        captured["payload"] = json.loads(request.content)
        return httpx.Response(200, json=response_body)

    with respx.mock:
        respx.post(COMPLETIONS_URL).mock(side_effect=capture_request)
        await client.chat("Follow-up", history=history)

    messages = captured["payload"]["messages"]
    # system + 2 history + 1 new = 4
    assert len(messages) == 4
    assert messages[0]["role"] == "system"
    assert messages[1] == history[0]
    assert messages[2] == history[1]
    assert messages[3] == {"role": "user", "content": "Follow-up"}


@pytest.mark.asyncio
async def test_chat_api_error(client):
    """chat() raises CopilotAPIError on non-200 response."""
    with respx.mock:
        respx.post(COMPLETIONS_URL).mock(
            return_value=httpx.Response(401, text="Unauthorized")
        )
        with pytest.raises(CopilotAPIError, match="401"):
            await client.chat("test")


@pytest.mark.asyncio
async def test_chat_malformed_response(client):
    """chat() raises CopilotAPIError when response body is missing expected keys."""
    with respx.mock:
        respx.post(COMPLETIONS_URL).mock(
            return_value=httpx.Response(200, json={"unexpected": "data"})
        )
        with pytest.raises(CopilotAPIError, match="Unexpected response format"):
            await client.chat("test")


@pytest.mark.asyncio
async def test_chat_authorization_header(client):
    """chat() sends the GitHub token as a ****** in the Authorization header."""
    captured = {}

    def capture(request: httpx.Request) -> httpx.Response:
        captured["auth"] = request.headers.get("Authorization", "")
        return httpx.Response(
            200,
            json={"choices": [{"message": {"role": "assistant", "content": "ok"}}]},
        )

    with respx.mock:
        respx.post(COMPLETIONS_URL).mock(side_effect=capture)
        await client.chat("hi")

    assert captured["auth"].startswith("Bearer ")
    assert "test-token" in captured["auth"]


# ---------------------------------------------------------------------------
# stream_chat()
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_stream_chat_success(client):
    """stream_chat() yields content chunks from SSE stream."""
    sse_body = (
        _sse_line({"choices": [{"delta": {"content": "Hello"}}]})
        + _sse_line({"choices": [{"delta": {"content": " world"}}]})
        + "data: [DONE]\n"
    )
    with respx.mock:
        respx.post(COMPLETIONS_URL).mock(
            return_value=httpx.Response(200, text=sse_body)
        )
        chunks = []
        async for chunk in client.stream_chat("hi"):
            chunks.append(chunk)

    assert chunks == ["Hello", " world"]


@pytest.mark.asyncio
async def test_stream_chat_api_error(client):
    """stream_chat() raises CopilotAPIError on non-200 response."""
    with respx.mock:
        respx.post(COMPLETIONS_URL).mock(
            return_value=httpx.Response(403, text="Forbidden")
        )
        with pytest.raises(CopilotAPIError, match="403"):
            async for _ in client.stream_chat("hi"):
                pass


# ---------------------------------------------------------------------------
# Context manager
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_context_manager_closes_client():
    """CopilotClient closes the HTTP client on __aexit__."""
    async with CopilotClient(github_token="tok") as c:
        await c._ensure_client()
        assert c._client is not None

    assert c._client is None
