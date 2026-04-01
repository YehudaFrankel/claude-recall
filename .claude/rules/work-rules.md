---
description: Core behavioral rules — search-first, verify-before-done, stop-on-unexpected
alwaysApply: true
---

# Work Rules — Behavioral Guardrails for Every Session

These rules apply to every task, every session, without exception.
They exist because the most common mistakes are process failures, not knowledge failures.

---

## Search Before Coding
Before writing any new function, endpoint, or component:
- Grep the codebase for existing implementations of the same thing
- Check `decisions.md` — has this approach already been decided?
- Check `tasks/regret.md` — has this approach already been rejected?

Never implement something that already exists. Never re-propose something already rejected.

## Cross-Reference Before Marking Done
Before reporting a task as complete:
- Read back the actual changed lines — not a summary, the content
- Confirm the change matches what was asked, not just what was planned
- If the change touches a shared utility or referenced function, check callers

"Done" means verified, not just written.

## Stop on Unexpected Behavior
If anything surprising happens mid-task — an unexpected error, a result that doesn't match expectations, a file that looks different than expected:
- **Stop immediately**
- Report what was found before continuing
- Do not work around it silently

Unexpected behavior is information. Routing around it without reporting it hides bugs.

## Never Assume Silence Means Success
A command that returns no output is not confirmed as successful.
After any Bash command, write, or edit:
- Check the exit code or return value explicitly
- Read back the result if it matters
- If the expected output is missing, investigate — don't assume it worked

## Verify Before Claiming Done
After every edit:
- Read the changed section back from the file
- Quote the actual content — not "I changed X to Y" but the literal lines
- Only write ✓ after quoting

A summary is not verification. The file content is verification.

## One Change at a Time
Do not stack multiple unverified changes. Apply one change, verify it, then proceed.
If a second change depends on the first being correct, verify the first before starting the second.

---

*These rules exist because skipping them is where sessions go wrong.*
*None of them feel necessary until the moment they are.*
