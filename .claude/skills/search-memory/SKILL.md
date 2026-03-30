---
name: search-memory
description: Deep cross-memory search using parallel subagents. Use when asked broad conceptual questions like "what do we know about X", "have we solved X before", "find anything about X" — questions that could live in multiple memory files. Simple lookups (single known file) still use --search directly.
allowed-tools: Agent, Read, Grep
effort: medium
---

# Skill: search-memory

## Description
Parallel subagent search across all memory categories. Spawns 4 agents simultaneously — one per category group — then aggregates their findings into a single ranked answer.

**Trigger phrases:**
- "what do we know about [X]"
- "have we seen [X] before"
- "search memory for [X]"
- "find anything about [X]"
- "check if we've dealt with [X]"
- Any question where the answer could live in 2+ memory files

**Simple queries → skip this skill, use `--search` directly:**
- "what's in lessons.md" → Read the file
- "grep for X in error-lookup" → Grep directly
- Known single-file lookups → no parallel needed

---

## Memory Categories

| Agent | Files it searches |
|-------|-------------------|
| **Agent A — Knowledge** | `lessons.md`, `decisions.md`, `regret.md` |
| **Agent B — Errors & Guards** | `error-lookup.md`, `critical-notes.md`, `guard-patterns.md` |
| **Agent C — Project State** | `project_status.md`, `code-map.md` (if exists), `your_journey_plan.md` (if exists) |
| **Agent D — Live Context** | `session_journal.md` (last 20 entries), `todo.md`, `tasks/velocity.md`, `tasks/skill_scores.md` |

Memory root: `[MEM]` = value read from the current project's MEMORY.md

---

## Steps

### Step 0 — Resolve [MEM] (required before anything else)

Before searching, confirm the memory root is configured:

1. Check if `[MEM]` is defined in the current session context (set by Start Session or CLAUDE.md)
2. If not known, look for it in the project's CLAUDE.md: grep for `\[MEM\]` or `memory` path definition
3. Verify at least one anchor file exists at the resolved path: `lessons.md` or `error-lookup.md`

**If [MEM] cannot be resolved or anchor files are missing — STOP:**
```
⚠ Memory root not configured.

[MEM] is not set or the memory files don't exist yet.
Run: Start Session
This pulls your memory from GitHub and initializes [MEM] for this session.

If this is a new project, run Start Session once to set up your memory root.
```

Do not proceed to Step 1 until [MEM] resolves to a real path with at least one memory file present.

---

### Step 1 — Extract the query
Identify the search term from the user's question. If vague ("that thing we fixed"), ask one clarifying question.

### Step 2 — Launch 4 parallel agents

Spawn all 4 in a single message (they run concurrently):

**Agent A prompt:**
```
Search for "[QUERY]" across these memory files:
- [MEM]/lessons.md
- [MEM]/decisions.md
- [MEM]/regret.md

Use Grep to search each file for the query term and related terms.
Return: file name, matching line(s), and a 1-2 sentence summary of what was found.
If nothing found, return "No match in [file]".
Do not read whole files — grep only.
```

**Agent B prompt:**
```
Search for "[QUERY]" across these memory files:
- [MEM]/error-lookup.md
- [MEM]/critical-notes.md (or rules/critical-notes.md if not in memory root)
- [MEM]/guard-patterns.md

Use Grep to search each file for the query term and related terms.
Return: file name, matching line(s), and a 1-2 sentence summary of what was found.
If nothing found, return "No match in [file]".
Do not read whole files — grep only.
```

**Agent C prompt:**
```
Search for "[QUERY]" across these memory files:
- [MEM]/project_status.md
- [MEM]/java_reference.md (if exists)
- [MEM]/js_functions.md (if exists)
- [MEM]/html_css_reference.md (if exists)

Use Grep to search each file for the query term and related terms.
Return: file name, matching line(s), and a 1-2 sentence summary of what was found.
If nothing found, return "No match in [file]".
Do not read whole files — grep only.
```

**Agent D prompt:**
```
Search for "[QUERY]" across these memory files:
- [MEM]/session_journal.md (last 30 lines only — use Read with offset to get tail)
- [MEM]/todo.md
- [MEM]/tasks/velocity.md (if exists)

Use Grep + Read(limit) to search each file for the query term and related terms.
Return: file name, matching content, and a 1-2 sentence summary of what was found.
If nothing found, return "No match in [file]".
```

### Step 3 — Aggregate results

Collect all 4 agent responses. Synthesize into:

```
## Memory search: "[QUERY]"

### Lessons / Decisions / Regret
[Agent A summary — or "Nothing found"]

### Errors / Guards / Critical Notes
[Agent B summary — or "Nothing found"]

### Project State / Reference
[Agent C summary — or "Nothing found"]

### Recent Context / Todo
[Agent D summary — or "Nothing found"]

---
**Bottom line:** [1-2 sentences: what we know, what we tried, what to watch out for]
```

### Step 4 — Offer to jump to source

If any agent found a specific match, offer:
> "Found in `[file]` — want me to read the full section?"

---

## Notes

- Launch all 4 agents in ONE message — they must run in parallel, not sequentially
- If a file doesn't exist, the agent skips it silently (no error)
- Agents search only — they never write, edit, or modify memory files
- For kit memory root: read `[MEM]` path from MEMORY.md or CLAUDE.md at session start
- This skill pairs with `act` — search first, then act on what's found
