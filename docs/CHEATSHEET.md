# Clankbrain Cheat Sheet

The whole kit fits on one page. Print it, screenshot it, keep it open.

---

## The 5 commands you'll use daily

| Type this | What it does |
|-----------|--------------|
| `Start Session` | Loads memory, tells you what changed last time |
| `End Session` | Saves what you learned to memory |
| `/learn` | Pulls lessons + decisions out of this conversation |
| `/plan [thing]` | Walks you through planning before you build |
| `/recall [topic]` | Asks memory "what do we know about X?" |

That's it. Everything else runs automatically.

---

## When something goes wrong

| Type this | When |
|-----------|------|
| `tour` | First time, or "show me how this works again" |
| `kit-health` | Did the install actually work? |
| `Check Drift` | Memory feels stale or wrong |
| `Update Kit` | Pull the latest version of Clankbrain |

---

## Build mode (declare at start of work)

| Mode | When |
|------|------|
| `Build mode: learn` | Prototyping, throwaway, "let me try" |
| `Build mode: earn` | Real production code, careful, planned |

The kit applies different conventions for each.

---

## How the magic works (one paragraph)

You tell Claude something → it gets saved to memory. You hit a problem → it gets saved to `regret.md`. Next session → Claude reads both before answering. You never have to repeat yourself, and Claude never repeats a mistake. Run `/learn` at end of session and the loop tightens.

That's the whole system.

---

## Where stuff lives

| What | Where |
|------|-------|
| Your project context | `CLAUDE.md` |
| Stuff Claude remembers | `.claude/memory/` |
| Reusable workflows | `.claude/skills/` |
| Project conventions | `.claude/rules/` |
| Past mistakes | `.claude/memory/tasks/regret.md` |
| Locked decisions | `.claude/memory/decisions.md` |

You don't have to touch any of these. Claude does.

---

## When you're stuck

1. Type `tour` — 5-minute walkthrough that makes the magic obvious
2. Read `QUICKSTART.md` — first session in detail
3. Open `CLAUDE.md` — every command, every workflow

Most problems = forgot to type `Start Session` at the beginning, or `End Session` at the end. Those two commands are 80% of the kit.
