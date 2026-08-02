"""Tests for bot/handlers.py."""

from __future__ import annotations

import pytest

from bot.handlers import (
    append_to_history,
    clear_history,
    get_history,
    _split_message,
)


# ---------------------------------------------------------------------------
# History helpers
# ---------------------------------------------------------------------------


def test_get_history_empty():
    """Returns empty list for a new user."""
    clear_history(99991)
    assert get_history(99991) == []


def test_append_and_get_history():
    """Appended messages are retrievable in order."""
    clear_history(99992)
    append_to_history(99992, "user", "Hello", max_history=20)
    append_to_history(99992, "assistant", "Hi there!", max_history=20)
    history = get_history(99992)
    assert len(history) == 2
    assert history[0] == {"role": "user", "content": "Hello"}
    assert history[1] == {"role": "assistant", "content": "Hi there!"}


def test_history_trimmed_to_max():
    """History is trimmed when it exceeds max_history."""
    clear_history(99993)
    for i in range(10):
        append_to_history(99993, "user", f"msg {i}", max_history=5)
    history = get_history(99993)
    assert len(history) == 5
    # Most recent messages are kept
    assert history[-1]["content"] == "msg 9"
    assert history[0]["content"] == "msg 5"


def test_clear_history():
    """Clearing history empties the list."""
    clear_history(99994)
    append_to_history(99994, "user", "test", max_history=20)
    clear_history(99994)
    assert get_history(99994) == []


# ---------------------------------------------------------------------------
# _split_message
# ---------------------------------------------------------------------------


def test_split_message_short():
    """Short messages are returned as-is."""
    result = _split_message("Hello, world!", max_length=4096)
    assert result == ["Hello, world!"]


def test_split_message_exact_limit():
    """Message exactly at the limit is returned as a single chunk."""
    text = "x" * 4096
    result = _split_message(text, max_length=4096)
    assert result == [text]


def test_split_message_long_splits_at_newline():
    """Long messages are split at newline boundaries."""
    line = "A" * 100
    # Build a message that is just over 200 chars with newlines
    text = (line + "\n") * 3  # 303 chars
    result = _split_message(text, max_length=200)
    assert len(result) > 1
    for chunk in result:
        assert len(chunk) <= 200


def test_split_message_no_newline_falls_back_to_hard_cut():
    """Messages without newlines are hard-cut at max_length."""
    text = "X" * 500
    result = _split_message(text, max_length=200)
    assert len(result) == 3
    for chunk in result:
        assert len(chunk) <= 200
