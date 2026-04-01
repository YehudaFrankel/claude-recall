---
name: Feature Build
description: Use when building a new feature from scratch. Chains search → plan → code → review → verify → learn in sequence with human-in-the-loop breakpoints.
---

# Feature Build Agent

Orchestrates the full feature workflow. Each step has a breakpoint — do not continue past a breakpoint without user confirmation.

---

## Step 1 — Search First
Invoke the `search-first` skill.
- Search the codebase for any existing implementation of this feature
- Check `decisions.md` — has this approach been settled?
- Check `tasks/regret.md` — has this approach been rejected?

**BREAKPOINT:** Report findings. If something relevant exists, surface it and ask: "Found [X]. Use/extend this, or build fresh?"

---

## Step 2 — Plan
Invoke the `plan` skill.
- Create or open `memory/plans/[feature-slug].md`
- Walk through: problem → research → 2–3 options with cost/friction/payoff → recommendation
- Show the full plan file

**BREAKPOINT:** "Here is the plan. Confirm to proceed with implementation, or adjust first?"

---

## Step 3 — Implement
Apply the plan. Follow `rules/plan-before-edit.md` — show Before/After for each edit and wait for approval before applying.

---

## Step 4 — Review
Invoke the `code-reviewer` skill on every file changed.
- Flag any correctness, security, or convention violations
- Fix all flagged issues before proceeding

**BREAKPOINT:** "Review complete. [N issues found / Clean]. Proceed to verification?"

---

## Step 5 — Verify
Invoke the `verification-loop` skill.
- Run drift check
- Run guard check
- Confirm the feature works end-to-end

**BREAKPOINT:** "Verification [passed / failed with N issues]. Ready to close out?"

---

## Step 6 — Learn
Run `/learn` — extract any lessons, decisions, or rejected approaches from this session into memory.

**Done.** Report: "Feature complete. Plan archived in `memory/plans/`. Lessons saved."
