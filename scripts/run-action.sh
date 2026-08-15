#!/usr/bin/env bash
set -euo pipefail

MAX_PROMPT_LENGTH=12000
MAX_CONTEXT_LENGTH=24000
MAX_TELEGRAM_TEXT_LENGTH=4000

request_id="telepilot-$(date +%s)-${RANDOM}${RANDOM}"
response=""
telegram_message_id=""
clarion_event_status="disabled"
start_epoch="$(date +%s)"

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command '$1' is not available."
}

write_output() {
  local key="$1"
  local value="$2"

  if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
    return
  fi

  {
    printf '%s<<TELEPILOT_EOF\n' "$key"
    printf '%s\n' "$value"
    printf 'TELEPILOT_EOF\n'
  } >> "$GITHUB_OUTPUT"
}

normalize_boolean() {
  local value="$1"

  case "$value" in
    true|false) printf '%s' "$value" ;;
    *) fail "Boolean inputs must be either 'true' or 'false'." ;;
  esac
}

emit_failure_event() {
  local message="$1"

  if [[ -z "${CLARION_EVENT_ENDPOINT:-}" && -z "${CLARION_EVENT_SECRET:-}" ]]; then
    return
  fi

  emit_clarion_event "FAILED" "" "$message" || true
}

fail() {
  local message="$1"
  local fail_on_error="${FAIL_ON_ERROR:-true}"

  echo "::error::${message}"
  emit_failure_event "$message"
  write_output "response" ""
  write_output "provider" "${PROVIDER:-unknown}"
  write_output "request-id" "$request_id"
  write_output "telegram-message-id" "$telegram_message_id"
  write_output "clarion-event-status" "$clarion_event_status"

  if [[ "$fail_on_error" == "true" ]]; then
    exit 1
  fi

  exit 0
}

validate_length() {
  local value="$1"
  local maximum="$2"
  local label="$3"

  if (( ${#value} > maximum )); then
    fail "$label exceeds the maximum length of $maximum characters."
  fi
}

is_allowed_telegram_chat() {
  local candidate="$1"
  local allowed_list="$2"

  if [[ -z "$allowed_list" ]]; then
    return 0
  fi

  local entry
  IFS=',' read -r -a entries <<< "$allowed_list"
  for entry in "${entries[@]}"; do
    if [[ "$(echo "$entry" | xargs)" == "$candidate" ]]; then
      return 0
    fi
  done

  return 1
}

emit_clarion_event() {
  local outcome="$1"
  local response_digest="$2"
  local summary="$3"

  if [[ -z "${CLARION_EVENT_ENDPOINT:-}" && -z "${CLARION_EVENT_SECRET:-}" ]]; then
    clarion_event_status="disabled"
    return 0
  fi

  if [[ -z "${CLARION_EVENT_ENDPOINT:-}" || -z "${CLARION_EVENT_SECRET:-}" ]]; then
    clarion_event_status="failed"
    [[ "${CLARION_EVENT_REQUIRED:-false}" == "true" ]] && return 1
    echo "::warning::Clarion event delivery is disabled because endpoint or secret is missing."
    return 0
  fi

  local end_epoch duration_ms payload signature
  end_epoch="$(date +%s)"
  duration_ms="$(( (end_epoch - start_epoch) * 1000 ))"
  payload="$(jq -cn \
    --arg type "TELEPILOT_EVENT" \
    --arg configuration_version "telepilot-v0" \
    --arg action_version "$ACTION_VERSION" \
    --arg request_id "$request_id" \
    --arg provider "$PROVIDER" \
    --arg outcome "$outcome" \
    --arg response_digest "$response_digest" \
    --arg summary "$summary" \
    --argjson duration_ms "$duration_ms" \
    '{organizationId: env.CLARION_ORGANIZATION_ID, request: ({type: $type, configurationVersion: $configuration_version, actionVersion: $action_version, requestId: $request_id, provider: $provider, outcome: $outcome, durationMs: $duration_ms} + (if ($response_digest | length) > 0 then {responseDigest: $response_digest} else {} end) + (if ($summary | length) > 0 then {summary: $summary} else {} end))}'
  )"

  if [[ -z "${CLARION_ORGANIZATION_ID:-}" ]]; then
    clarion_event_status="failed"
    [[ "${CLARION_EVENT_REQUIRED:-false}" == "true" ]] && return 1
    echo "::warning::Clarion event delivery is disabled because CLARION_ORGANIZATION_ID is not configured."
    return 0
  fi

  signature="sha256=$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$CLARION_EVENT_SECRET" -hex | sed 's/^.* //')"

  if ! curl --fail-with-body --silent --show-error \
    --request POST \
    --header "Content-Type: application/json" \
    --header "X-Telepilot-Signature: $signature" \
    --data "$payload" \
    "$CLARION_EVENT_ENDPOINT" >/dev/null; then
    clarion_event_status="failed"
    [[ "${CLARION_EVENT_REQUIRED:-false}" == "true" ]] && return 1
    echo "::warning::Clarion event delivery failed."
    return 0
  fi

  clarion_event_status="delivered"
}

require_command curl
require_command jq
require_command openssl
require_command sha256sum

FAIL_ON_ERROR="$(normalize_boolean "${FAIL_ON_ERROR:-true}")"
CLARION_EVENT_REQUIRED="$(normalize_boolean "${CLARION_EVENT_REQUIRED:-false}")"

if [[ "${PROVIDER:-}" != "openai" ]]; then
  fail "Unsupported provider '${PROVIDER:-}'. Telepilot v0 supports only 'openai'."
fi

if [[ -z "${API_KEY:-}" ]]; then
  fail "api-key is required."
fi

if [[ -z "${PROMPT:-}" ]]; then
  fail "prompt is required."
fi

validate_length "$PROMPT" "$MAX_PROMPT_LENGTH" "prompt"
validate_length "${CONTEXT:-}" "$MAX_CONTEXT_LENGTH" "context"

if [[ -n "${TELEGRAM_BOT_TOKEN:-}" || -n "${TELEGRAM_CHAT_ID:-}" ]]; then
  if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
    fail "telegram-bot-token and telegram-chat-id must be provided together."
  fi

  if ! is_allowed_telegram_chat "$TELEGRAM_CHAT_ID" "${TELEGRAM_ALLOWED_CHAT_IDS:-}"; then
    fail "telegram-chat-id is not in telegram-allowed-chat-ids."
  fi
fi

full_prompt="${PROMPT}"
if [[ -n "${CONTEXT:-}" ]]; then
  full_prompt="${CONTEXT}\n\n${PROMPT}"
fi

request_body="$(jq -cn \
  --arg model "${MODEL:-gpt-4o-mini}" \
  --arg content "$full_prompt" \
  '{model: $model, messages: [{role: "user", content: $content}]}'
)"

provider_response="$(mktemp)"
trap 'rm -f "$provider_response"' EXIT

if ! curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header "Content-Type: application/json" \
  --data "$request_body" \
  --output "$provider_response" \
  "$API_ENDPOINT"; then
  fail "Provider request failed."
fi

response="$(jq -r '.choices[0].message.content // empty' "$provider_response")"
if [[ -z "$response" ]]; then
  fail "Provider response did not include a text completion."
fi

response_digest="$(printf '%s' "$response" | sha256sum | awk '{print $1}')"

if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  telegram_text="${response:0:$MAX_TELEGRAM_TEXT_LENGTH}"
  telegram_response="$(mktemp)"
  trap 'rm -f "$provider_response" "$telegram_response"' EXIT

  telegram_payload="$(jq -cn --arg chat_id "$TELEGRAM_CHAT_ID" --arg text "$telegram_text" '{chat_id: $chat_id, text: $text}')"
  if ! curl --fail-with-body --silent --show-error \
    --request POST \
    --header "Content-Type: application/json" \
    --data "$telegram_payload" \
    --output "$telegram_response" \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"; then
    fail "Telegram delivery failed."
  fi

  telegram_message_id="$(jq -r '.result.message_id // empty' "$telegram_response")"
  if [[ -z "$telegram_message_id" ]]; then
    fail "Telegram delivery did not return a message ID."
  fi
fi

if ! emit_clarion_event "SUCCEEDED" "$response_digest" ""; then
  fail "Clarion event delivery failed."
fi

write_output "response" "$response"
write_output "provider" "$PROVIDER"
write_output "request-id" "$request_id"
write_output "telegram-message-id" "$telegram_message_id"
write_output "clarion-event-status" "$clarion_event_status"

echo "::notice::Telepilot completed using provider '$PROVIDER' (request-id: $request_id)."
