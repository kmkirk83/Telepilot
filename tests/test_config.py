"""Tests for config.py."""

from __future__ import annotations

import os
import pytest

from config import Config


def test_config_from_env_minimal(monkeypatch):
    """Config loads with only required environment variables."""
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tg-token-123")
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_abc123")
    monkeypatch.delenv("ALLOWED_USER_IDS", raising=False)
    monkeypatch.delenv("COPILOT_API_URL", raising=False)
    monkeypatch.delenv("COPILOT_MODEL", raising=False)
    monkeypatch.delenv("MAX_HISTORY", raising=False)

    config = Config.from_env()

    assert config.telegram_bot_token == "tg-token-123"
    assert config.github_token == "ghp_abc123"
    assert config.allowed_user_ids == []
    assert config.copilot_api_url == "https://api.githubcopilot.com"
    assert config.copilot_model == "gpt-4o"
    assert config.max_history == 20


def test_config_from_env_full(monkeypatch):
    """Config loads all optional environment variables."""
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tg-token-123")
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_abc123")
    monkeypatch.setenv("ALLOWED_USER_IDS", "111,222, 333")
    monkeypatch.setenv("COPILOT_API_URL", "https://custom.copilot.example.com/")
    monkeypatch.setenv("COPILOT_MODEL", "gpt-4-turbo")
    monkeypatch.setenv("MAX_HISTORY", "50")

    config = Config.from_env()

    assert config.allowed_user_ids == [111, 222, 333]
    assert config.copilot_api_url == "https://custom.copilot.example.com"  # trailing slash stripped
    assert config.copilot_model == "gpt-4-turbo"
    assert config.max_history == 50


def test_config_missing_telegram_token(monkeypatch):
    """Config raises ValueError when TELEGRAM_BOT_TOKEN is missing."""
    monkeypatch.delenv("TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_abc123")

    with pytest.raises(ValueError, match="TELEGRAM_BOT_TOKEN"):
        Config.from_env()


def test_config_missing_github_token(monkeypatch):
    """Config raises ValueError when GITHUB_TOKEN is missing."""
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tg-token-123")
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)

    with pytest.raises(ValueError, match="GITHUB_TOKEN"):
        Config.from_env()


def test_is_user_allowed_no_restrictions():
    """All users are allowed when allowed_user_ids is empty."""
    config = Config(
        telegram_bot_token="tok",
        github_token="ghp",
        allowed_user_ids=[],
    )
    assert config.is_user_allowed(99999) is True
    assert config.is_user_allowed(1) is True


def test_is_user_allowed_with_restrictions():
    """Only listed users are allowed when allowed_user_ids is set."""
    config = Config(
        telegram_bot_token="tok",
        github_token="ghp",
        allowed_user_ids=[100, 200],
    )
    assert config.is_user_allowed(100) is True
    assert config.is_user_allowed(200) is True
    assert config.is_user_allowed(300) is False
