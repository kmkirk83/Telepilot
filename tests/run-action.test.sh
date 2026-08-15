#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

make_fake_curl() {
  mkdir -p "$temporary_directory/bin"
  cat > "$temporary_directory/bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

output_file=""
request_data=""
request_url=""
signature=""
while (( $# > 0 )); do
  case "$1" in
    --output)
      output_file="$2"
      shift 2
      ;;
    --data)
      request_data="$2"
      shift 2
      ;;
    --header)
      if [[ "$2" == X-Telepilot-Signature:* ]]; then
        signature="${2#X-Telepilot-Signature: }"
      fi
      shift 2
      ;;
    --request)
      shift 2
      ;;
    --fail-with-body|--silent|--show-error)
      shift
      ;;
    *)
      request_url="$1"
      shift
      ;;
  esac
done

if [[ "$request_url" == "https://clarion.example.test/events" ]]; then
  printf '%s' "$request_data" > "$TELEPILOT_TEST_EVENT_FILE"
  printf '%s' "$signature" > "${TELEPILOT_TEST_EVENT_FILE}.signature"
  if [[ -n "$output_file" ]]; then
    printf '%s' '{}' > "$output_file"
  fi
  exit 0
fi

printf '%s' '{"choices":[{"message":{"content":"Telepilot test response"}}]}' > "$output_file"
EOF
  chmod +x "$temporary_directory/bin/curl"
}

run_success_case() {
  local output_file="$temporary_directory/success-output"
  make_fake_curl

  PATH="$temporary_directory/bin:$PATH" \
  GITHUB_OUTPUT="$output_file" \
  PROMPT="Summarize the release." \
  PROVIDER="openai" \
  API_KEY="test-key" \
  API_ENDPOINT="https://provider.example.test/chat/completions" \
  MODEL="test-model" \
  CONTEXT="" \
  TELEGRAM_BOT_TOKEN="" \
  TELEGRAM_CHAT_ID="" \
  TELEGRAM_ALLOWED_CHAT_IDS="" \
  CLARION_EVENT_ENDPOINT="" \
  CLARION_EVENT_SECRET="" \
  CLARION_ORGANIZATION_ID="" \
  CLARION_EVENT_REQUIRED="false" \
  FAIL_ON_ERROR="true" \
  ACTION_VERSION="v0.1.0" \
  bash "$repo_root/scripts/run-action.sh"

  grep -Fq "Telepilot test response" "$output_file"
  grep -Fq "openai" "$output_file"
  grep -Fq "disabled" "$output_file"
}

run_clarion_event_case() {
  local output_file="$temporary_directory/clarion-output"
  local event_file="$temporary_directory/clarion-event.json"

  PATH="$temporary_directory/bin:$PATH" \
  TELEPILOT_TEST_EVENT_FILE="$event_file" \
  GITHUB_OUTPUT="$output_file" \
  PROMPT="Summarize the release." \
  PROVIDER="openai" \
  API_KEY="test-key" \
  API_ENDPOINT="https://provider.example.test/chat/completions" \
  MODEL="test-model" \
  CONTEXT="" \
  TELEGRAM_BOT_TOKEN="" \
  TELEGRAM_CHAT_ID="" \
  TELEGRAM_ALLOWED_CHAT_IDS="" \
  CLARION_EVENT_ENDPOINT="https://clarion.example.test/events" \
  CLARION_EVENT_SECRET="clarion-event-test-secret" \
  CLARION_ORGANIZATION_ID="org_test_123" \
  CLARION_EVENT_REQUIRED="true" \
  FAIL_ON_ERROR="true" \
  ACTION_VERSION="v0.1.0" \
  bash "$repo_root/scripts/run-action.sh"

  grep -Fq '"organizationId":"org_test_123"' "$event_file"
  grep -Fq '"type":"TELEPILOT_EVENT"' "$event_file"
  grep -Fq '"responseDigest":' "$event_file"
  if grep -Fq "Telepilot test response" "$event_file"; then
    echo "Clarion event payload included the response body." >&2
    exit 1
  fi
  if [[ ! -s "${event_file}.signature" ]]; then
    echo "Clarion event signature was missing." >&2
    exit 1
  fi
}

run_invalid_telegram_case() {
  local output_file="$temporary_directory/telegram-output"

  GITHUB_OUTPUT="$output_file" \
  PROMPT="Summarize the release." \
  PROVIDER="openai" \
  API_KEY="test-key" \
  API_ENDPOINT="https://provider.example.test/chat/completions" \
  MODEL="test-model" \
  CONTEXT="" \
  TELEGRAM_BOT_TOKEN="telegram-token" \
  TELEGRAM_CHAT_ID="-1000001" \
  TELEGRAM_ALLOWED_CHAT_IDS="-1000002" \
  CLARION_EVENT_ENDPOINT="" \
  CLARION_EVENT_SECRET="" \
  CLARION_ORGANIZATION_ID="" \
  CLARION_EVENT_REQUIRED="false" \
  FAIL_ON_ERROR="false" \
  ACTION_VERSION="v0.1.0" \
  bash "$repo_root/scripts/run-action.sh"

  grep -Fq "openai" "$output_file"
}

run_success_case
run_clarion_event_case
run_invalid_telegram_case

echo "Telepilot action contract tests passed."
