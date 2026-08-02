# Contributing to Telepilot

Thank you for your interest in contributing to Telepilot! This document explains how to contribute effectively.

## Code of Conduct

Please be respectful and constructive in all interactions. We follow the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** before opening a new one.
2. Use the **Bug Report** issue template and include:
   - Steps to reproduce
   - Expected behaviour
   - Actual behaviour
   - Environment (OS, Node/Python version, Docker version if applicable)
   - Relevant log output

### Suggesting Features

1. Open a **Feature Request** issue describing:
   - The problem you are trying to solve
   - Your proposed solution
   - Any alternative solutions you considered
2. Wait for feedback before starting implementation to avoid wasted effort.

### Submitting Pull Requests

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Install dependencies** and confirm tests pass before making changes:
   ```bash
   npm install
   npm test
   ```

3. **Make your changes** following the guidelines below.

4. **Write or update tests** to cover your changes.

5. **Run the full test suite**:
   ```bash
   npm test
   npm run lint
   ```

6. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add support for inline code snippets in responses
   fix: handle Telegram API timeout gracefully
   docs: update webhook setup instructions
   chore: bump dependencies
   ```

7. **Push and open a Pull Request** against `main`. Fill in the PR template completely.

## Development Guidelines

### Code Style

- Follow the existing code style in the repository.
- Use TypeScript or typed Python where applicable for maintainability.
- Keep functions small and focused.
- Document public APIs with JSDoc / docstrings.

### Testing

- Write unit tests for all new logic.
- Integration tests should be clearly marked and must not require live API credentials to run.
- Do not introduce `console.log` / `print` statements in production code; use the logger.

### Security

- Do not introduce secrets, tokens, or hardcoded credentials.
- Validate all inputs before forwarding to external APIs.
- Review [SECURITY.md](SECURITY.md) for the project security policy.

### Documentation

- Update `README.md` if your change affects setup, configuration, or usage.
- Add an entry to `CHANGELOG.md` under `[Unreleased]` describing your change.

## Branching Strategy

| Branch pattern | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Maintenance tasks |
| `docs/*` | Documentation-only changes |

## Release Process

Releases are managed by the maintainers:

1. Changes are merged to `main` via pull request.
2. A maintainer creates a new versioned tag (e.g. `v1.1.0`) following [Semantic Versioning](https://semver.org/).
3. GitHub Actions automatically builds and publishes the release.

## Getting Help

If you have questions, open a [GitHub Discussion](../../discussions) or see [SUPPORT.md](SUPPORT.md).
