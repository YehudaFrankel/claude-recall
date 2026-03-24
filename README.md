# Claude Recall — Agentic Engineering Starter for Claude Code

[![v2.0.0](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)](https://github.com/YehudaFrankel/claude-recall/releases) [![Python 3.7+](https://img.shields.io/badge/python-3.7+-blue?style=flat-square)](https://python.org/downloads) [![MIT License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE) [![Claude Code](https://img.shields.io/badge/Claude-Code-orange?style=flat-square)](https://claude.ai/claude-code)

![Session demo — Start Session, drift detection, End Session](demo.gif)

**Claude Code is stateless. Claude Recall makes it agentic.**

Point it at your project. Claude learns your codebase, remembers every decision, improves its own skills from failures, and runs multi-step workflows without human checkpoints — compounding session over session.

**[The Three Tiers](#the-three-tiers) · [Quick Start](#quick-start) · [The Learning Loop](#the-compound-learning-loop) · [Autonomous Behaviors](#autonomous-behaviors) · [Commands](#commands) · [What Gets Created](#what-gets-created)**

---

## The Three Tiers

```
Tier 1 — Memory      Claude remembers your codebase, decisions, and patterns across sessions
Tier 2 — Skills      Claude learns from mistakes and improves its own workflows automatically
Tier 3 — Autonomous  Multi-step tasks run without human checkpoints between each step
```

Most memory tools stop at Tier 1. Claude Recall ships all three.

---

## The Problem

Claude Code starts from zero every session.

No memory of yesterday's decisions. No record of bugs already fixed. No knowledge of the approach you rejected two weeks ago. You re-explain the codebase. Claude re-suggests things you already discarded. The same mistake happens twice.

On a long project this compounds fast — and the bigger the codebase, the worse it gets.

---

## Quick Start

**Requires:** Python 3.7+ · [Claude Code](https://claude.ai/claude-code)

**Step 1 — Clone**
```bash
git clone https://github.com/YehudaFrankel/claude-recall.git
```

**Step 2 — Run setup in your project**
```bash
cd your-project
python /path/to/claude-recall/setup.py
```

Claude asks a few questions (project name, tech stack, files to track), then builds everything in about 2 minutes.

**Step 3 — Start working**
```
Start Session    ←  every morning
End Session      ←  when done
```

That's the entire routine. Sessions crash? Open a new one, type `Start Session` — Claude reads memory and continues where you left off.

<details>
<summary>▸ No terminal? Paste into chat instead</summary>

> Analyze this codebase and set up the Claude memory system. Scan all JS, CSS, and backend files. Document everything. Create CLAUDE.md, STATUS.md, and .claude/memory/ files pre-filled with what you find.

</details>

---

## The Compound Learning Loop

Skills get smarter automatically over time:

```
session work
     ↓
/learn  →  lessons.md        (what was learned)
        →  decisions.md      (what was settled)
        →  skill_scores.md   (did each skill work? Y/N)
        →  velocity.md       (estimated vs actual)
                ↓
          /evolve  →  patches failing skills (fixes the exact step that failed)
                   →  clusters repeated patterns into new skills
                   →  logs improvements to skill_improvements.md
                ↓
          better skills next session — automatically
```

**Run `/learn` before `End Session`. Run `/evolve` every 3–5 sessions.**

After 10 sessions, Claude knows your patterns. After 50, it knows your codebase better than any fresh context ever could. The same mistake is never made twice.

---

## Autonomous Behaviors

These run without prompting.

### Skill Chaining
Skills trigger the next skill on pass or fail. Add `## Auto-Chain` to any `SKILL.md`:

```markdown
## Auto-Chain
- **On pass:** → run `verification-loop`
- **On fail:** → run `debug-[topic]`, then retry
```

Example chain:
```
fix-bug → verification-loop → smoke-test
               ↓ if fail
           debug-[topic] → smoke-test
```
No human steps between. Claude reads the chain and runs it.

### Self-Healing on Failure
When a verify step fails:
1. Claude attempts the minimal fix autonomously
2. Retries once
3. Only escalates to you if the second attempt also fails

Add a `## Recovery` section to any skill to define what "minimal fix" means for that skill.

### Auto End Session
The stop hook monitors every response. After 9pm with unsaved memory changes, it auto-commits and pushes memory to git — so nothing is lost even if you forget `End Session`. `/learn` still runs manually (it needs Claude's analysis), but raw memory is always safe.

### Drift Detection (always on)
Runs automatically after every file edit. Compares live code against Claude's memory and flags:
- Functions in code but not in memory
- Functions in memory but deleted from code
- New CSS classes Claude doesn't know about

```
DRIFT DETECTED
  JS functions not in memory (3):
    - submitForm
    - resetPanel
    - loadUserData
Run 'Analyze Codebase' to update memory.
```

Silent when clean. Zero interruption.

---

## Commands

### Daily
| Command | What it does |
|---------|-------------|
| `Start Session` | Reads memory + lessons + decisions, runs drift check, picks up where you left off |
| `End Session` | Runs `/learn`, updates STATUS.md, syncs memory files |
| `/learn` | Extracts lessons, scores skills, logs velocity — auto-runs at End Session |
| `/evolve` | Patches failing skills, clusters repeated patterns into new skills |
| `"Should I compact?"` | Guides safe context compaction without losing memory |

### Analysis
| Command | What it does |
|---------|-------------|
| `Check Drift` | Scans live code vs memory — find undocumented functions, stale entries |
| `Analyze Codebase` | Full scan of all JS, CSS, and backend — documents everything |
| `Code Health` | Finds leftover debug code, hardcoded values, dead code, missing error handling |

### Setup & Recovery
| Command | What it does |
|---------|-------------|
| `Setup Memory` | First-time setup |
| `Install Memory` | New machine — copies memory files to Claude's system path |
| `Update Kit` | Pull latest updates safely — your memory files are never touched |

### Planning
| Command | What it does |
|---------|-------------|
| `Estimate: [task]` | Complexity rating, file list, risk flags, written plan — before any code |
| `Debug Session` | Reproduce → isolate → hypothesize → fix → verify → log |
| `Handoff` | Generates `HANDOFF.md` with current state, next tasks, key decisions |
| `Generate Skills` | Auto-creates skills tailored to your stack |

---

## What Gets Created

```
your-project/
├── CLAUDE.md                        ← Claude reads this every session
├── STATUS.md                        ← Full session log
├── update.py                        ← Safe kit updater
├── tools/
│   ├── check_memory.py              ← Drift detector — runs after every edit
│   ├── session_start.py             ← Injects memory on SessionStart
│   ├── precompact.py                ← Preserves memory through /compact
│   ├── session_journal.py           ← Auto-captures session summary on every Stop
│   ├── bootstrap.py                 ← Zero-setup codebase indexer
│   └── stop_check.py               ← Auto-pushes memory after 9pm if unsaved
└── .claude/
    ├── settings.json                ← Hooks: drift · session start · compact · stop
    ├── memory/
    │   ├── MEMORY.md                ← Index — auto-loaded every session
    │   ├── lessons.md               ← Every lesson extracted by /learn
    │   ├── decisions.md             ← Settled architectural decisions
    │   ├── project_status.md        ← What's built, what's not
    │   ├── js_functions.md          ← Every JS function with description
    │   ├── html_css_reference.md    ← Every HTML section and CSS class
    │   ├── backend_reference.md     ← Every API endpoint and DB pattern
    │   ├── user_preferences.md      ← How you like Claude to work
    │   └── tasks/
    │       ├── skill_scores.md      ← Skill effectiveness log (/evolve reads this)
    │       ├── skill_improvements.md← What /evolve patched and why
    │       ├── regret.md            ← Rejected approaches (never re-proposed)
    │       └── velocity.md          ← Estimated vs actual (self-calibrating)
    └── skills/
        ├── learn/                   ← /learn — extract lessons + score skills
        ├── evolve/                  ← /evolve — patch failing skills, cluster patterns
        ├── fix-bug/
        ├── code-review/
        ├── security-check/
        ├── new-feature/
        ├── strategic-compact/
        ├── search-first/
        ├── verification-loop/
        └── java-reviewer/
```

Commit `tools/`, `.claude/memory/`, and `.claude/skills/` to your repo. Memory and skills travel with the code — pull on a new machine, type `Install Memory`, done.

---

## Lifecycle Hooks

Four hooks run automatically — no commands needed.

| Hook | When | What it does |
|------|------|-------------|
| `SessionStart` | Opening Claude Code | Injects memory into context — Claude starts warm |
| `PostToolUse` | After every Edit/Write | Runs drift check — catches undocumented changes immediately |
| `PreCompact` | Before `/compact` | Reinjects memory into compacted context — nothing lost |
| `Stop` | After every response | Captures session journal + auto-pushes memory after 9pm |

---

## Real-World Results

Battle-tested across 112 sessions on a production Java platform — legacy backend, 5 JS files, 100+ functions, multi-page frontend with scheduler, email system, and encrypted URL handling.

- Sessions crashed mid-task — `Start Session` recovered full context every time, zero re-explanation
- A large feature (~50 functions, ~100 CSS classes) added across multiple sessions — drift detection caught everything undocumented automatically
- A Resin 2.1.17 compiler bug (anonymous generic inner classes fail at runtime) discovered, fixed, and permanently logged — never cost another debugging session
- Skills patched themselves via `/evolve` — the same skill failure never happened twice

**Agentic score after full setup: 8.5/10.** The remaining 1.5 is intentional — you still initiate sessions and approve plans. Full autonomy without human initiation is an agent, not an assistant.

---

## Known Limitations

- **Drift detection is file-based** — `check_memory.py` compares function names, not logic. A renamed function registers as a new one.
- **Combined memory entries** — `js_functions.md` requires one function per row. Entries like `funcA / funcB` only match the first.
- **JS keyword false positives** — the class-method regex can match keywords as function names. The included `JS_SKIP_NAMES` filter handles common ones — extend it if needed.
- **`/learn` needs Claude** — extracting lessons requires analysis. The stop hook auto-pushes raw memory, but lesson extraction is always a manual step.

---

## Requirements

- [Claude Code](https://claude.ai/claude-code) installed and authenticated
- Python 3.7+ — [python.org/downloads](https://python.org/downloads)
- Nothing else

---

> Built across 112 real development sessions on a production codebase. The drift detector found 21 undocumented functions on the first run. Skills were added after noticing the same prompts typed every day. The compound learning loop came from watching `/evolve` catch a skill failure and patch itself. Everything here came from actual use — nothing hypothetical.

---

If claude-recall moved your workflow from stateless to agentic, **[⭐ star it on GitHub](https://github.com/YehudaFrankel/claude-recall)** — it helps others find it.

**[YehudaFrankel/claude-recall](https://github.com/YehudaFrankel/claude-recall)**
