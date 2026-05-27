# Security Policy

## Supported Versions

Only the latest release version of GhostLens is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| v0.1.x  | :white_check_mark: |
| < v0.1  | :x:                |

## Reporting a Vulnerability

We take the security of GhostLens seriously. If you find any security vulnerabilities, please do **NOT** open a public GitHub issue. Instead, report them privately to ensure they are patched before public disclosure.

Please report vulnerabilities through one of the following methods:
- **Email**: Send a detailed report to `security@ghostlens.app` or directly to Shaurya Tiwari.

### What to Include in a Report
To help us triage and patch the vulnerability quickly, please include:
- A detailed description of the vulnerability.
- Steps to reproduce (proof of concept code, configuration settings, or screenshots).
- The potential impact (e.g. privilege escalation, local data leakage, API key exposure).

## Response Timeline

We commit to the following timeline when handling security reports:
1. **Initial Acknowledgment**: Within 48 hours of receipt.
2. **Status Update / Triage**: Within 5 business days, confirming whether we can reproduce the issue and its severity.
3. **Patch Release**: Depending on the severity, we aim to release a patch or mitigation guidelines within 14 business days.
4. **Public Disclosure**: Coordinated disclosure after a patch is widely available.

## Local Data Security & API Keys

GhostLens runs entirely locally on your machine. 
- All settings, histories, and clipboard logs are stored in a local SQLite database (`ghostlens.db`).
- API keys are passed directly to the configured AI provider endpoints (Gemini, OpenAI, Claude) and are not sent to any intermediary server.
- To maximize local security, avoid sharing your SQLite database file or environment configurations.
