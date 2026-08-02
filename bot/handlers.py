"""Telegram bot command and message handlers."""

from __future__ import annotations

import logging
from collections import defaultdict
from typing import Optional

from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.ext import ContextTypes

from config import Config
from copilot.client import CopilotAPIError, CopilotClient

logger = logging.getLogger(__name__)

# Per-user conversation history: {user_id: [{"role": ..., "content": ...}, ...]}
_conversation_history: dict[int, list[dict[str, str]]] = defaultdict(list)


def get_history(user_id: int) -> list[dict[str, str]]:
    """Return the conversation history for a user."""
    return _conversation_history[user_id]


def clear_history(user_id: int) -> None:
    """Clear the conversation history for a user."""
    _conversation_history[user_id] = []


def append_to_history(
    user_id: int,
    role: str,
    content: str,
    max_history: int = 20,
) -> None:
    """Append a message to a user's conversation history, trimming if needed."""
    history = _conversation_history[user_id]
    history.append({"role": role, "content": content})
    # Keep at most max_history messages (trimming oldest first)
    if len(history) > max_history:
        _conversation_history[user_id] = history[-max_history:]


def _escape_markdown_v2(text: str) -> str:
    """Escape special characters for Telegram MarkdownV2.

    Characters that must be escaped: _ * [ ] ( ) ~ ` > # + - = | { } . !
    """
    escape_chars = r"\_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{c}" if c in escape_chars else c for c in text)


def _format_response(text: str) -> tuple[str, str]:
    """Return (formatted_text, parse_mode) for a Telegram message.

    Tries Markdown first and falls back to plain text on failure.
    """
    return text, ParseMode.MARKDOWN


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /start command."""
    config: Config = context.bot_data["config"]
    user = update.effective_user
    if user is None or update.message is None:
        return

    if not config.is_user_allowed(user.id):
        await update.message.reply_text("Sorry, you are not authorised to use this bot.")
        return

    welcome = (
        f"👋 Hello, {user.first_name}! I'm *Telepilot* — GitHub Copilot connected to Telegram.\n\n"
        "You can ask me anything about code: write it, review it, debug it, explain it.\n\n"
        "*Commands:*\n"
        "/new — Start a fresh conversation\n"
        "/help — Show this help message\n"
        "/model — Show the active model\n\n"
        "Just send me a message to get started! 🚀"
    )
    await update.message.reply_text(welcome, parse_mode=ParseMode.MARKDOWN)


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /help command."""
    if update.message is None:
        return
    help_text = (
        "*Telepilot — GitHub Copilot on Telegram*\n\n"
        "Send any message to chat with GitHub Copilot.\n\n"
        "*Commands:*\n"
        "/start — Introduction\n"
        "/new — Clear history and start a new conversation\n"
        "/help — Show this message\n"
        "/model — Show the currently active Copilot model\n\n"
        "*Tips:*\n"
        "• Ask Copilot to write, review or debug code\n"
        "• Paste code snippets directly into the chat\n"
        "• Ask follow-up questions — conversation context is kept between messages\n"
        "• Use /new to reset context when switching topics"
    )
    await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN)


async def new_conversation_handler(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    """Handle the /new command — reset conversation history."""
    config: Config = context.bot_data["config"]
    user = update.effective_user
    if user is None or update.message is None:
        return

    if not config.is_user_allowed(user.id):
        await update.message.reply_text("Sorry, you are not authorised to use this bot.")
        return

    clear_history(user.id)
    await update.message.reply_text(
        "🔄 Conversation cleared. Starting fresh!", parse_mode=ParseMode.MARKDOWN
    )


async def model_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the /model command — show the active model."""
    config: Config = context.bot_data["config"]
    if update.message is None:
        return
    await update.message.reply_text(
        f"🤖 Active model: `{config.copilot_model}`", parse_mode=ParseMode.MARKDOWN
    )


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle plain text messages by forwarding them to GitHub Copilot."""
    config: Config = context.bot_data["config"]
    copilot: CopilotClient = context.bot_data["copilot"]

    user = update.effective_user
    if user is None or update.message is None or not update.message.text:
        return

    if not config.is_user_allowed(user.id):
        await update.message.reply_text("Sorry, you are not authorised to use this bot.")
        return

    user_text = update.message.text.strip()
    if not user_text:
        return

    # Show typing indicator while waiting for Copilot
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id, action=ChatAction.TYPING
    )

    history = get_history(user.id)
    logger.info("User %s sent message (history=%d turns)", user.id, len(history))

    try:
        response = await copilot.chat(user_text, history=history)
    except CopilotAPIError as exc:
        logger.error("Copilot API error for user %s: %s", user.id, exc)
        await update.message.reply_text(
            "⚠️ Copilot returned an error. Please try again later.\n\n"
            f"Details: `{exc}`",
            parse_mode=ParseMode.MARKDOWN,
        )
        return
    except Exception as exc:
        logger.exception("Unexpected error for user %s: %s", user.id, exc)
        await update.message.reply_text(
            "⚠️ An unexpected error occurred. Please try again."
        )
        return

    # Update conversation history
    append_to_history(user.id, "user", user_text, max_history=config.max_history)
    append_to_history(user.id, "assistant", response, max_history=config.max_history)

    text, parse_mode = _format_response(response)

    # Telegram has a 4096-character message limit — split if needed
    for chunk in _split_message(text):
        try:
            await update.message.reply_text(chunk, parse_mode=parse_mode)
        except Exception:
            # Fallback to plain text if markdown parsing fails
            await update.message.reply_text(chunk)


def _split_message(text: str, max_length: int = 4096) -> list[str]:
    """Split a long message into chunks that fit within Telegram's limit."""
    if len(text) <= max_length:
        return [text]

    chunks: list[str] = []
    while text:
        if len(text) <= max_length:
            chunks.append(text)
            break
        # Try to split at a newline near the limit
        split_at = text.rfind("\n", 0, max_length)
        if split_at == -1:
            split_at = max_length
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    return chunks
