# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.x | ✅ |
| 1.x | ✅ |
| < 1.0 | ❌ |

## Reporting a Vulnerability

If you discover a security issue in claude-recall, please email yehudafrankel24@gmail.com directly rather than opening a public GitHub issue.

You can expect a response within 48 hours. If the vulnerability is confirmed it will be prioritized and patched as soon as possible.

## Security Model

claude-recall runs entirely locally — no data leaves your machine, no cloud services, no API keys required. The attack surface is limited to the Python scripts in the `tools/` directory and the setup/update scripts.
