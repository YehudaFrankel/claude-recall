# Quickstart — Your First 3 Sessions

You've installed Clankbrain. Here's what to do in your first three sessions to get the compounding effect working.

---

## Session 1 will feel like a normal Claude session. That's expected.

Memory is empty. There are no saved lessons, no rejected approaches, no known bugs. Claude has nothing to load yet — so it behaves exactly like Claude without Clankbrain.

**Don't judge it on session 1.** The gap opens by session 5. By session 10 it's obvious.

---

## Session 1 — Establish baseline

**At the start:**
```
Start Session
```
Claude reads memory (empty so far) and asks what you're working on. Describe your project once. Claude will remember it from now on.

**During the session:** Work normally. Fix a bug, add a feature, whatever.

**At the end:**
```
End Session
```
Claude will ask: **"What are three things about this codebase I should never forget?"**

Answer with anything that trips up AI assistants — constraints, gotchas, patterns unique to your stack. Each answer gets written to `lessons.md` and loaded from session 2 onward. If you have nothing yet, say "nothing yet" and Claude moves on.

**What gets saved:** `lessons.md` (with your answers), `decisions.md`, `STATUS.md`. The memory files exist now.

---

## Session 2 — First real memory use

**At the start:**
```
Start Session
```
Claude reads the lessons from session 1 and arrives with context. You don't re-explain anything.

**When something breaks:** Ask Claude to diagnose it. It already knows your stack from session 1.

**At the end:**
```
End Session
```
More lessons accumulate. Patterns start forming.

---

## Session 3 — Learning loop activates

**At the end of session 3:**
```
End Session
```

This time, /evolve-check runs automatically and reports skill health. You might see:

```
🟢 STABLE — learn: 3 clean sessions
🟢 STABLE — plan: 2 uses, 0 corrections
```

If any skill needed a correction during any of the 3 sessions, it will show:

```
🟡 WATCH — [skill]: 1 correction logged
```

At 2 corrections on the same skill → run `/evolve` to patch it.

---

## The skill decision tree

Not sure which skill to use? Match your intent:

| I want to... | Use |
|---|---|
| Start working (new session) | `Start Session` |
| Plan a feature or change | `/plan` |
| Find where something lives in code | `/find-it` or `/search-first` |
| Fix a bug | `/fix-bug` |
| Check nothing broke after changes | `/smoke-test` |
| Extract lessons from this session | `/learn` |
| See which skills need improvement | `/evolve-check` |
| Patch a skill based on failure data | `/evolve` |
| Search past decisions and lessons | `/recall [topic]` |
| End the session and save memory | `End Session` |

---

## When does the compounding start?

- **Session 1:** Claude knows your project description and first lessons
- **Session 5:** Claude has seen your common bugs and knows your patterns
- **Session 10:** You stop re-explaining. Claude knows what broke last time
- **Session 20+:** Skills have been patched by real failure data. Claude produces fewer mistakes on your codebase specifically

The system gets measurably better. The skills literally improve — not just remember, but get better at the same tasks.

---

## The two things that break the loop

1. **Skipping End Session** — lessons don't get saved, skill scores don't accumulate, /evolve has no data to work with
2. **Skipping /evolve when skills are 🔴/🟡** — the feedback loop stalls; the same mistakes keep happening

Everything else is optional. These two are the minimum viable habit.

---

## What good skill scores look like after 20 sessions

```
=== Evolve Check ===

🟢 STABLE — learn: 18 clean sessions
🟢 STABLE — plan: 12 uses, 0 corrections
🔵 PATCHED — smoke-test: patched 2024-12-10, 3 uses since patch
🟢 STABLE — fix-bug: 8 clean sessions
```

`smoke-test` was patched once and is now being verified. Everything else is stable. That's a healthy project memory at session 20.

→ [Full learning loop explained with real examples](docs/loop-proof.md)
→ [Every command](docs/commands.md)
→ [How skills self-improve](docs/skills.md)
