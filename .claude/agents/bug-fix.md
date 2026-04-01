---
name: Bug Fix
description: Use when diagnosing and fixing a bug. Chains reproduce → isolate → hypothesize → fix → verify → learn with human-in-the-loop breakpoints at each stage.
---

# Bug Fix Agent

Structured bug investigation. Never touch code until the root cause is confirmed. Each stage has a breakpoint.

---

## Step 1 — Reproduce
Invoke the `debug-session` skill (reproduce + isolate phases only).
- Confirm the bug is actually happening — check logs, run the code, see the failure
- Do NOT assume. Do NOT guess. See it happen.

**BREAKPOINT:** "Bug reproduced: [what happens vs what should happen]. Proceed to isolate?"

---

## Step 2 — Isolate
Narrow down exactly where it breaks.
- Which file, which function, which line
- Read the actual code — do not rely on memory of what it does

**BREAKPOINT:** "Isolated to [file:line] — [function name]. Root cause hypothesis: [one sentence]. Correct?"

---

## Step 3 — Fix
Follow `rules/plan-before-edit.md`:
- Show Before/After for the minimal change that addresses the confirmed root cause
- Fix ONLY what is confirmed — no opportunistic cleanup

Wait for approval, then apply.

**BREAKPOINT:** "Fix applied. Verify before closing?"

---

## Step 4 — Verify
- Read the changed lines back and confirm they match the After block
- Confirm the bug no longer reproduces
- Confirm nothing adjacent broke

**BREAKPOINT:** "Verified [clean / N regressions found]. Log and close?"

---

## Step 5 — Log + Learn
- Add one line to `tasks/errors.md`: `[date] | [error] | [root cause] | [fix]`
- Run `/learn` — extract any lessons from this session

**Done.** Report: "Bug fixed. Root cause: [X]. Logged. Lessons saved."
