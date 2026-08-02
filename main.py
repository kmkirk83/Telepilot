"""Telepilot — GitHub Copilot connected to Telegram.

Entry point: starts the Telegram bot and wires up all handlers.

Usage:
    python main.py
"""

from __future__ import annotations

import asyncio
import logging
import signal
import sys

from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
)

from bot.handlers import (
    help_handler,
    message_handler,
    model_handler,
    new_conversation_handler,
    start_handler,
)
from config import Config
from copilot.client import CopilotClient

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


async def run_bot(config: Config) -> None:
    """Build and start the Telegram bot."""
    copilot = CopilotClient(
        github_token=config.github_token,
        api_url=config.copilot_api_url,
        model=config.copilot_model,
    )

    app = (
        Application.builder()
        .token(config.telegram_bot_token)
        .build()
    )

    # Make config and copilot client available to all handlers
    app.bot_data["config"] = config
    app.bot_data["copilot"] = copilot

    # Register command handlers
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("help", help_handler))
    app.add_handler(CommandHandler("new", new_conversation_handler))
    app.add_handler(CommandHandler("model", model_handler))

    # Register message handler for all non-command text messages
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler)
    )

    logger.info(
        "Starting Telepilot bot (model=%s, allowed_users=%s)",
        config.copilot_model,
        config.allowed_user_ids or "all",
    )

    try:
        await app.initialize()
        await app.start()
        await app.updater.start_polling(drop_pending_updates=True)
        logger.info("Bot is running. Press Ctrl+C to stop.")

        # Block until a termination signal is received
        stop_event = asyncio.Event()

        def _signal_handler(*_: object) -> None:
            stop_event.set()

        for sig in (signal.SIGINT, signal.SIGTERM):
            signal.signal(sig, _signal_handler)

        await stop_event.wait()
    finally:
        logger.info("Shutting down...")
        await app.updater.stop()
        await app.stop()
        await app.shutdown()
        await copilot.close()


def main() -> None:
    """Parse configuration and start the bot."""
    try:
        config = Config.from_env()
    except ValueError as exc:
        logger.error("Configuration error: %s", exc)
        sys.exit(1)

    asyncio.run(run_bot(config))


if __name__ == "__main__":
    main()
