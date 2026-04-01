---
description: Context management — when to compact, /learn before /compact, 80% stop rule
alwaysApply: true
---

# Token Rules — Context Management Guardrails

Context limits cause more lost work than bugs do.
These rules prevent mid-task compaction from destroying progress.

---

## Check Context Before Starting Large Tasks
Before beginning any task estimated at 3+ sessions or touching 5+ files:
- Check current context level (stop-check surfaces this automatically)
- If above 60% — run `/learn` first to extract lessons, then `/compact`
- If above 80% — do not start. Compact first, confirm memory is intact, then begin

Starting a large task near the context limit guarantees an interrupted session.

## /learn Before /compact — Always
Never compact without running `/learn` first.
Compaction preserves memory files but not the reasoning in the conversation.
`/learn` extracts that reasoning into `lessons.md` before it's gone.

Order: `/learn` → `/compact` → confirm memory loaded → continue.

## Stop and Report at 80%
When context reaches 80%, stop the current task — even mid-step.
Report:
- What was completed
- What remains
- The exact next step to resume

Then compact. Then resume from the reported next step.

Do not try to finish "just this one more thing" at 80%+. It will get cut off.

## Keep CLAUDE.md Under 50 Lines of Content
The project-specific section of CLAUDE.md (below `## What This Project Is`) should stay under 50 lines.
Project knowledge belongs in `.claude/memory/` files that load selectively.
A bloated CLAUDE.md loads on every prompt and eats context that should go to the task.

Run `Context Score` periodically to find dead weight.

## Prefer Memory Files Over Inline Context
When explaining something to Claude that will matter next session:
- Write it to the relevant memory file (`decisions.md`, `critical-notes.md`, `lessons.md`)
- Don't rely on the conversation history

Conversation history compacts. Memory files don't.

---

*The context limit is not a soft suggestion. It is a hard wall.*
*Everything above these rules is the cost of hitting it without a plan.*
