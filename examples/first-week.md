# Your First Week with Clankbrain

A day-by-day guide showing what changes as the system learns your project.

---

## Day 1 — First Session

You run `Start Session`. Claude has no memory yet.

```
You:    Start Session

Claude: Memory files not found. Running --bootstrap to index your codebase...

        quick_index.md created:
          JS: 12 files, 340 functions
          CSS: 4 files, 180 classes
          Backend: 6 files

        Ready. No previous status found — this looks like a new project.
        What are we working on?
```

You describe a bug. Claude asks a few questions, reads the relevant files, proposes a fix.

The plan-before-edit rule fires — Claude shows you the plan with verified line numbers before touching anything. You say "yes". Claude edits the file. The verify-edit hook fires — Claude quotes the changed lines back to you. You confirm.

You run `End Session`. Claude runs `/learn`, writes to `lessons.md`, updates `STATUS.md`.

**What's saved after Day 1:**
- `lessons.md`: patterns from this session
- `decisions.md`: any architectural choices you made
- `STATUS.md`: "Session 1 — fixed login redirect bug"
- `quick_index.md`: full codebase index

---

## Day 2 — Memory Kicks In

```
You:    Start Session

Claude: Ready. Last change: Session 1 — fixed login redirect bug.
        Lessons loaded: 3 entries.
        What are we working on?
```

Claude already knows your codebase structure from `quick_index.md`. It already knows the pattern from yesterday's bug. You don't re-explain anything.

You ask for a new feature. Claude searches existing code first (search-first skill fires), finds a related function, proposes a plan that reuses existing patterns instead of inventing new ones.

**What's different from Day 1:**
- No re-explaining the project
- Claude avoids the pattern it got wrong yesterday (it's in `lessons.md`)
- Plans reference real line numbers from your actual codebase

---

## Day 3 — The Reviewer Gets Smarter

You ask Claude to review a PR.

```
You:    Review this change

Claude: (Step 0) Loading project context...
          lessons.md: 5 entries loaded — 2 relevant to this file
          decisions.md: 3 locked decisions
          complexity_profile.md: SQL backend, Vanilla JS frontend detected

        Reviewing against project-specific checklist...

        ISSUES FOUND
        ─────────────
        ■ CRITICAL — src/api/users.js:142
          Raw SQL concatenation: "WHERE id = " + userId
          Project lesson (session 1): always use fmtCondition for WHERE clauses
          Fix: UFmt.fmtCondition("id", "=", userId, Types.INTEGER)

        ■ WARN — src/api/users.js:156
          Missing OrganizationID in WHERE clause
          Locked decision: multi-tenant tables always filter by OrganizationID

        CLEAN
        ─────────────
        ✓ Auth pattern — correct
        ✓ Error handling — correct
        ✓ JS pattern — correct
```

The reviewer flagged issues using *your* past mistakes, not generic rules. By Day 3 it already knows the patterns that trip you up.

---

## Day 5 — Run /evolve

After 5 sessions you have enough data. Run `/evolve`.

```
You:    /evolve

Claude: Reading skill_scores.md...
          search-first: 4 sessions, 1 correction (missed existing helper)
          code-reviewer: 3 sessions, 0 corrections
          plan: 5 sessions, 0 corrections

        Patching search-first step 2:
          Before: "Search for similar function names"
          After:  "Search for similar function names AND check helpers/ directory —
                   project has shared helpers that aren't always named obviously"

        Skill improvements logged to skill_improvements.md.
        search-first updated.
```

The skill that kept missing your helper directory now knows about it. That specific miss will never happen again.

---

## Day 7 — The System Has Context

By the end of week 1, a typical session looks like:

```
You:    Start Session

Claude: Ready. Last change: Session 6 — added bulk email feature.
        Lessons loaded: 12 entries.
        Open plan: email-retry-logic.md (1 unresolved question — retry count limit)
        What are we working on?
```

Claude picks up the open plan from last session. It already has the context. You answer the one open question and it continues from exactly where you stopped.

**What compounds over time:**
- Every `/learn` adds patterns Claude won't repeat
- Every `/evolve` patches the specific step that failed
- Every `decisions.md` entry is one less thing to re-debate
- `velocity.md` builds a track record — estimates get more accurate

The kit is designed so the longer you use it, the less you need to explain. Week 1 is the slowest week.

---

## Quick Reference

| When | What to run |
|------|------------|
| Start of every session | `Start Session` |
| End of every session | `End Session` |
| Every 3–5 sessions | `/evolve` |
| When code drifts from docs | `Check Drift` |
| Lost context mid-session | `Should I compact?` |
| New machine | `Pull Memory` then `Start Session` |
