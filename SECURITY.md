# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.x | ✅ |
| 1.x | ✅ |
| < 1.0 | ❌ |

## Reporting a Vulnerability

If you discover a security issue in clankbrain, please email yehudafrankel24@gmail.com directly rather than opening a public GitHub issue.

You can expect a response within 48 hours. If the vulnerability is confirmed it will be prioritized and patched as soon as possible.

## Security Model

clankbrain runs entirely locally — no data leaves your machine, no cloud services, no API keys required. The attack surface is limited to the Python scripts in the `tools/` directory and the setup/update scripts.

**Data flow is one-way:** kit updates are pulled from GitHub to your machine. Nothing is ever pushed back to clankbrain. Memory files stay on disk by default — cross-machine sync is opt-in and goes to your own private repo, not clankbrain's.

**For business use:** clankbrain is safe for general development work. For regulated industries, pair with an Anthropic enterprise plan and keep memory local (no git sync).
