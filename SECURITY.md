# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability in Telepilot, please report it responsibly:

1. **Email**: Send details to the repository owner via GitHub's private vulnerability reporting feature.
2. **GitHub Security Advisories**: Use the [Report a Vulnerability](../../security/advisories/new) button in the GitHub Security tab.

Please include:
- A description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Any proof-of-concept code (if applicable).
- Suggested mitigation or fix (if you have one).

You can expect an initial response within **72 hours** and a resolution timeline within **7 days** for critical issues.

## Security Considerations

### Secrets and Credentials

- **Never** commit `.env` files, tokens, or credentials to the repository.
- Always use GitHub Actions secrets (`Settings → Secrets and variables → Actions`) for CI/CD.
- Rotate tokens immediately if they are accidentally exposed.

### Telegram Webhook Security

- Set `TELEGRAM_WEBHOOK_SECRET` to a long, random string and validate it on every incoming request.
- Use HTTPS exclusively for your webhook endpoint.
- Consider restricting inbound traffic to Telegram's IP ranges.

### GitHub Token Scopes

Telepilot requires the following minimum GitHub token permissions:

| Permission | Scope | Reason |
|---|---|---|
| Copilot API | `copilot` | Generate AI responses |
| GitHub Models | `models:read` | Alternative inference endpoint |
| Repository metadata | `repo:read` (optional) | Provide code context to Copilot |

Use a **GitHub App installation token** rather than a long-lived PAT wherever possible.

### GitHub App Permissions (if registering as a GitHub App)

| Permission | Level | Reason |
|---|---|---|
| Contents | Read | Provide repository context to Copilot |
| Pull requests | Read | Summarise PR changes |
| Issues | Read | Provide issue context |
| Copilot | Read | Access GitHub Copilot API |
| Metadata | Read | Required for all GitHub Apps |

### Webhook Events (GitHub App)

The following webhook events should be subscribed to if using the GitHub App integration:

- `push` — optionally notify Telegram on new commits
- `pull_request` — trigger automated PR summaries
- `issues` — optionally post issue summaries to Telegram

### Access Control

- Use `ALLOWED_TELEGRAM_USERS` to restrict bot access to known Telegram user IDs.
- Rotate all secrets periodically and immediately after any suspected compromise.

## Responsible Disclosure

We are committed to working with security researchers to quickly resolve vulnerabilities. We will credit researchers who responsibly disclose issues (with their permission).
