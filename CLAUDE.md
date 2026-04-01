# [Project Name] — Claude Code Project Context

> **Keep this file under 200 lines.** Commands only. Project conventions → `rules/project-context.md`. Everything Claude needs to remember → `.claude/memory/`. Long sessions → `/learn` then `/compact`.

---

## Session Commands

| Tier | Commands |
|------|----------|
| **Core** | `Start Session` · `End Session` |
| **On Demand** | `Plan` · `Debug Session` · `/learn` · `/evolve` · `Check Drift` · `Guard Check` · `Pre-Ship Check` · `Code Health` · `Mode` · `Estimate` · `Handoff` · `Search Memory` · `Generate Guards` · `Generate Skills` · `Update Kit` |
| **Opt-In** | `Team Pull` / `Team Push` · `Sync Memory` / `Pull Memory` |

---

### `Setup Memory`
If `setup.py` exists run it. Otherwise: `python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/clankbrain/main/install.py').read().decode())"`

### `Start Session`
1. Run `python tools/memory.py --session-start`
2. Read `STATUS.md` → `memory/lessons.md` → `memory/decisions.md` → `memory/tasks/regret.md` → `memory/tasks/todo.md`
3. Scan `memory/plans/` — surface any file with `Status: Draft` or `On Hold`
4. Report: "Session N ready. Last change: [X]. What are we working on?"

### `End Session`
1. Run `/learn` — extract lessons + decisions from this session
2. Update memory files for everything changed (see Auto-Save Rule)
3. Update `STATUS.md` — increment session, one-line summary
4. Run `python tools/memory.py --check-drift`
5. Report: "Session N complete. Updated: [list]. Memory clean."

### `Plan [feature]`
Invoke the `plan` skill. Opens/creates `memory/plans/[slug].md`, walks problem → research → options → decision → spec. Always show the **full plan file** after every update — never a diff or summary.

### `Debug Session`
Invoke the `debug-session` skill: reproduce → isolate → hypothesize → fix only the confirmed root cause → verify → log to `tasks/errors.md`.

### On-Demand Commands
| Command | Action |
|---------|--------|
| `Check Drift` | `python tools/memory.py --check-drift` — fix any found |
| `Guard Check` | `python tools/memory.py --guard-check` — PASS/FAIL per guard |
| `Pre-Ship Check` | guard-check + drift-check + session edit count + `git diff --stat` |
| `Code Health` | Scan for console.log, hardcoded values, missing error handling, dead code, files >500 lines |
| `Mode [develop\|review\|safe\|deploy]` | Set + enforce tool access constraints for the session |
| `Estimate: [task]` | Read files → complexity + risk + file list → write to todo.md if confirmed |
| `Handoff` | Generate `HANDOFF.md` from STATUS + todo + decisions + errors + gotchas |
| `Search Memory: [topic]` | `python tools/memory.py --search "[topic]"` |
| `Progress Report` | `python tools/memory.py --progress-report` |
| `Kit Health` | `python tools/memory.py --kit-health` — fix FAILs immediately |
| `Generate Guards` | Invoke `generate-guards` skill |
| `Generate Skills` | Invoke `generate-guards` then scan stack for useful project skills |
| `Analyze Codebase` | Scan all JS/CSS/backend files, update memory files with findings |
| `Install Memory` | Scan codebase, fill memory files, copy to system memory path |
| `Update Kit` | Run `update.py` if present, otherwise fetch from clankbrain repo |
| `/learn` | Invoke `learn` skill — extract lessons, decisions, rejected approaches |
| `/evolve` | Invoke `evolve` skill — patch failing skills, cluster patterns (every 3–5 sessions) |

### Team + Sync (opt-in)
Setup: `python tools/team_sync.py setup-team [repo-url]` / `python sync.py setup [repo-url]`
- `Team Pull` / `Team Push` → `python tools/team_sync.py pull-team` / `push-team`
- `Sync Memory` / `Pull Memory` → `python sync.py push` / `python sync.py pull`

---

## Skill Map

| Workflow | Skills in Order |
|----------|----------------|
| **New Feature** | `search-first` → `plan` → *(code)* → `code-reviewer` → `verification-loop` → `/learn` |
| **Bug Fix** | `debug-session` → *(fix)* → `verification-loop` → `/learn` |
| **End of Session** | `/learn` → `/evolve` *(every 3–5 sessions)* |
| **Maintenance** | `check-drift` → `guard-check` → `code-health` |
| **Memory** | `/recall [topic]` · `search-memory` · `/forget [topic]` |

Full agent orchestrations (human-in-the-loop breakpoints): see `.claude/agents/`

---

## Auto-Save Rule

After any code change, immediately update the relevant memory file — don't wait for End Session:

| What changed | Update this |
|---|---|
| JS function added/changed | `js_functions.md` |
| HTML/CSS changed | `html_css_reference.md` |
| Endpoint or backend method | `backend_reference.md` |
| Architecture decision | `decisions.md` |
| Rejected approach | `tasks/regret.md` |
| Any change when code-map exists | `code-map.md` — flow, line number, DB entry |

---

## Autonomous Behaviors

- **Skill chaining:** add `## Auto-Chain` to any SKILL.md — `On pass: → run X` / `On fail: → run Y`
- **Self-healing:** minimal fix → retry → escalate only if second attempt fails (add `## Recovery` to skills)
- **Unsaved memory reminder:** stop hook fires when memory has unsaved changes
- **Compound learning:** `/learn` every session → `skill_scores.md` → `/evolve` every 3–5 sessions → better skills

---

@rules/plan-before-edit.md
@rules/work-rules.md
@rules/token-rules.md

---

> **Project conventions, file paths, tech stack, design system, and gotchas belong in `rules/project-context.md`.**
> Copy the template: `cp examples/project-context-template.md .claude/rules/project-context.md`

## Session Starter Prompt
> "Read CLAUDE.md and STATUS.md. We're continuing [Project Name]. Check which phases are complete and let's pick up where we left off."
