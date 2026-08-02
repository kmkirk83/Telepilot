"""Configuration management for Telepilot."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Config:
    """Application configuration loaded from environment variables."""

    telegram_bot_token: str
    github_token: str
    allowed_user_ids: list[int] = field(default_factory=list)
    copilot_api_url: str = "https://api.githubcopilot.com"
    copilot_model: str = "gpt-4o"
    max_history: int = 20

    @classmethod
    def from_env(cls) -> "Config":
        """Create a Config instance from environment variables."""
        telegram_bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
        if not telegram_bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN environment variable is required")

        github_token = os.environ.get("GITHUB_TOKEN", "")
        if not github_token:
            raise ValueError("GITHUB_TOKEN environment variable is required")

        allowed_user_ids: list[int] = []
        raw_ids = os.environ.get("ALLOWED_USER_IDS", "").strip()
        if raw_ids:
            for uid in raw_ids.split(","):
                uid = uid.strip()
                if uid:
                    allowed_user_ids.append(int(uid))

        copilot_api_url = os.environ.get(
            "COPILOT_API_URL", "https://api.githubcopilot.com"
        ).rstrip("/")

        copilot_model = os.environ.get("COPILOT_MODEL", "gpt-4o")

        max_history = int(os.environ.get("MAX_HISTORY", "20"))

        return cls(
            telegram_bot_token=telegram_bot_token,
            github_token=github_token,
            allowed_user_ids=allowed_user_ids,
            copilot_api_url=copilot_api_url,
            copilot_model=copilot_model,
            max_history=max_history,
        )

    def is_user_allowed(self, user_id: int) -> bool:
        """Return True if the user is allowed to use the bot.

        If no allowed_user_ids are configured, all users are allowed.
        """
        if not self.allowed_user_ids:
            return True
        return user_id in self.allowed_user_ids
