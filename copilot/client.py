"""Async GitHub Copilot API client.

Uses the GitHub Copilot chat completions endpoint which accepts an
OpenAI-compatible request format.
"""

from __future__ import annotations

import json
from typing import AsyncIterator, Optional

import httpx

COPILOT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "editor-version": "Neovim/0.6.1",
    "editor-plugin-version": "copilot.vim/1.16.0",
    "openai-intent": "conversation-panel",
    "openai-organization": "github-copilot",
    "User-Agent": "GitHubCopilotChat/0.12.0",
}

SYSTEM_PROMPT = (
    "You are GitHub Copilot, an AI programming assistant integrated into Telegram. "
    "Help the user with coding tasks, code reviews, debugging, explaining concepts, "
    "writing documentation, and any development-related questions. "
    "When providing code, use proper markdown code blocks with the language specified "
    "(e.g. ```python). Be concise but thorough."
)


class CopilotClient:
    """Async client for the GitHub Copilot chat completions API."""

    def __init__(
        self,
        github_token: str,
        api_url: str = "https://api.githubcopilot.com",
        model: str = "gpt-4o",
        timeout: float = 60.0,
    ) -> None:
        self._github_token = github_token
        self._api_url = api_url.rstrip("/")
        self._model = model
        self._timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "CopilotClient":
        await self._ensure_client()
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    async def _ensure_client(self) -> None:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self._timeout)

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        self._client = None

    def _build_headers(self) -> dict[str, str]:
        return {
            **COPILOT_HEADERS,
            "Authorization": "Bearer " + self._github_token,
        }

    def _build_messages(
        self,
        user_message: str,
        history: list[dict[str, str]],
    ) -> list[dict[str, str]]:
        """Construct the full messages list including system prompt and history."""
        messages: list[dict[str, str]] = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
        messages.extend(history)
        messages.append({"role": "user", "content": user_message})
        return messages

    async def chat(
        self,
        user_message: str,
        history: Optional[list[dict[str, str]]] = None,
    ) -> str:
        """Send a chat message and return the assistant's response.

        Args:
            user_message: The user's message.
            history: Prior conversation turns as a list of
                     {"role": "user"|"assistant", "content": "..."} dicts.

        Returns:
            The assistant response text.

        Raises:
            CopilotAPIError: If the API returns a non-200 response.
        """
        await self._ensure_client()
        assert self._client is not None

        messages = self._build_messages(user_message, history or [])
        payload = {
            "model": self._model,
            "messages": messages,
            "stream": False,
            "n": 1,
            "temperature": 0.1,
            "top_p": 1,
        }

        response = await self._client.post(
            f"{self._api_url}/chat/completions",
            headers=self._build_headers(),
            json=payload,
        )

        if response.status_code != 200:
            raise CopilotAPIError(
                f"Copilot API error {response.status_code}: {response.text}"
            )

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise CopilotAPIError(
                f"Unexpected response format from Copilot API: {data}"
            ) from exc

    async def stream_chat(
        self,
        user_message: str,
        history: Optional[list[dict[str, str]]] = None,
    ) -> AsyncIterator[str]:
        """Stream a chat response, yielding text chunks as they arrive.

        Args:
            user_message: The user's message.
            history: Prior conversation turns.

        Yields:
            Text chunks from the assistant response.

        Raises:
            CopilotAPIError: If the API returns a non-200 response.
        """
        await self._ensure_client()
        assert self._client is not None

        messages = self._build_messages(user_message, history or [])
        payload = {
            "model": self._model,
            "messages": messages,
            "stream": True,
            "n": 1,
            "temperature": 0.1,
            "top_p": 1,
        }

        async with self._client.stream(
            "POST",
            f"{self._api_url}/chat/completions",
            headers=self._build_headers(),
            json=payload,
        ) as response:
            if response.status_code != 200:
                body = await response.aread()
                raise CopilotAPIError(
                    f"Copilot API error {response.status_code}: {body.decode()}"
                )

            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = line[len("data: "):]
                if chunk.strip() == "[DONE]":
                    break
                try:
                    data = json.loads(chunk)
                    delta = data["choices"][0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


class CopilotAPIError(Exception):
    """Raised when the GitHub Copilot API returns an unexpected response."""
