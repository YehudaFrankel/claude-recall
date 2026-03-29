# Example Memory Files

These are realistic examples of each memory type. Copy them to `.claude/memory/` and edit to match your project.

| File | Type | What it shows |
|------|------|---------------|
| `user_profile.md` | user | Developer background, communication preferences |
| `feedback_testing.md` | feedback | A correction with the reason behind it |
| `feedback_style.md` | feedback | A style preference Claude should apply without being asked |
| `project_auth_rewrite.md` | project | An ongoing initiative with locked decisions |
| `reference_infrastructure.md` | reference | Where to find things in external systems |

## The pattern that matters most

Every feedback memory has three parts:
1. **The rule** — what to do or not do
2. **Why** — the reason (incident, preference, constraint)
3. **How to apply** — when this kicks in

Without the "why", Claude can't judge edge cases. With it, one saved correction prevents the same mistake forever.
