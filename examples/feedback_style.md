---
name: feedback_style
description: Code style preferences — what this developer expects without being asked
type: feedback
---

Don't add comments explaining what the code does — only add comments explaining why a non-obvious decision was made.

**Why:** Over-commented code is harder to read, not easier. The user reads code fluently and finds explanatory comments patronizing.

**How to apply:** Skip docstrings and inline comments on straightforward code. Only comment when the logic would confuse a competent reader (e.g. a workaround, a performance trick, a non-obvious constraint).
