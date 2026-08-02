# Privacy and Data Processing

Telepilot receives Telegram webhook payloads and forwards plain-text message content to the configured AI provider to generate a reply.

## Data handled

- Telegram chat identifiers
- Telegram sender display information
- Plain-text message content
- Provider responses returned to Telegram

## Data retention

The connector is stateless by default. It does not persist message content unless you add storage in your deployment environment.

## Third-party processing

If you configure OpenAI or Anthropic, message content is sent to that provider to generate a reply. Review the provider's own privacy and retention policies before production use.

## Operator responsibilities

Operators are responsible for:

- securing deployment infrastructure
- protecting environment variables and bot credentials
- limiting allowed chat IDs when access should be restricted
- publishing final privacy and terms links for their own marketplace listing
