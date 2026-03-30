---
name: act
description: Reads recent session context, infers what you were working on, and proposes the specific next action. Use when resuming after a break, or say "act" / "what should we do next" / "pick up where we left off". Executes immediately on confirmation.
allowed-tools: Agent, Read, Grep, Bash
effort: low
---

# Skill: act

## Description
Reads the last session journal entries, open todos, and active plans to infer current intent — then proposes and executes the single most useful next action without being asked.

**Trigger phrases:**
- "act"
- "what should we do next"
- "pick up where we left off"
- "what were we doing"
- "continue"
- "resume"
- (also fires automatically at Start Session if there are open High-priority todos)

---

## Steps

### Step 1 — Read context (parallel)

Read all three sources at once:

1. **`[MEM]/session_journal.md`** — last 40 lines (recent session summaries)
2. **`[MEM]/todo.md`** — full file (High/Medium priorities only)
3. **`[MEM]/plans/`** — list open (non-archived) plan files, read the most recently modified one

```
Read([MEM]/session_journal.md, offset=last 40 lines)
Read([MEM]/todo.md)
Glob([MEM]/plans/*.md, excluding plans/archive/)
```

### Step 2 — Infer intent

From the context read, identify:

- **What was being built/fixed** — look for the last task mentioned in session_journal.md
- **What's blocked or open** — todos marked `[ ]` with High priority
- **What plan is active** — any plan file with `Status: In Progress` or `Status: Draft`

Rank candidates:
1. An in-progress plan with an identified next step
2. A High-priority open todo
3. The last thing mentioned in session_journal.md

### Step 3 — Propose one specific action

State exactly what you propose to do. Be specific — not "continue the feature" but:

> "Last session we finished the Java method for `adminSendIntroEmail` but hadn't wired the HFmtWebservice endpoint yet. I'll add the routing line and test it now."

Or:

> "Your todo.md has one High-priority open item: 'Fix session tab scroll position reset on mobile'. I'll investigate the CSS/JS cause now."

Format:
```
## Picking up

**Last context:** [1 sentence from session_journal]
**Open item:** [specific todo or plan step]

**Proposed action:** [exactly what I'll do in the next 2 minutes]

Go? (yes / skip / show me the full context)
```

### Step 4 — Execute on confirmation

If user says yes / go / do it:
- Execute the proposed action immediately
- No re-asking, no re-summarizing
- After completion, update `[MEM]/todo.md` (check off or add follow-up) and `[MEM]/session_journal.md`

If user says skip:
- Show the next candidate from the ranked list
- Repeat step 3

If user says "show me the full context":
- Print the relevant section from session_journal.md + the matched todo/plan

---

## Notes

- Never propose more than one action at a time — focus wins over completeness
- If context is genuinely ambiguous (no journal entries, empty todo, silent STATUS.md), say so and ask what to work on — `act` cannot invent intent from nothing; it surfaces what's already been decided
- This skill is intentionally opinionated — it picks one thing and drives it
- Pairs with `search-memory` when the proposed action needs prior-art research first
- "act" on Clankbrain kit tasks = look at D:\claude-memory-starter changes
- "act" on webapps tasks = look at the TicTacWisdom/InfoGrasp codebase
