---
name: feedback_testing
description: How to handle tests in this project — what to avoid and why
type: feedback
---

Never mock the database in integration tests.

**Why:** Last quarter mocked tests passed but the prod migration failed silently — the mock didn't catch a missing column. Cost two days of debugging.

**How to apply:** Any test that touches data must hit a real DB (test instance). Only mock external services (email, Stripe, etc.).
