# Claude Code Memory Starter Kit

Gives Claude a permanent memory for your project. Claude normally forgets everything when you close a session. This kit fixes that — Claude remembers your code, your decisions, and your session history, and picks up exactly where you left off.

---

## What's in the Kit (4 files)

| File | What it does |
|------|-------------|
| `CLAUDE.md` | Teaches Claude the commands |
| `setup.py` | Sets everything up for your project |
| `tools/check_memory.py` | Catches code drift automatically |
| `update.py` | Safely updates the kit from GitHub |

---

## What Setup Creates in Your Project

```
your-project/
├── CLAUDE.md                    ← Claude's brain for this project
├── STATUS.md                    ← Session log (date + what changed)
├── update.py                    ← Safe kit updater
├── tools/
│   └── check_memory.py          ← Configured for your JS/CSS files
└── .claude/
    ├── settings.json            ← Hooks: drift check after every file edit
    ├── memory/
    │   ├── MEMORY.md            ← Index, auto-loaded every session
    │   ├── project_status.md
    │   ├── js_functions.md
    │   ├── html_css_reference.md
    │   ├── backend_reference.md
    │   └── user_preferences.md
    └── skills/
        ├── code-review/
        ├── security-check/
        ├── fix-bug/
        ├── new-feature/
        ├── environment-check/     ← "ready for prod", "before deploy"
        ├── run-verification/      ← "verify this works", "before I ship"
        └── refactor/              ← "refactor", "clean up", "simplify"
```

---

## Your Daily Workflow

```
type "claude"  →  type "Start Session"
                          ↓
                   work on your project
                          ↓
                  type "End Session"
```

Claude updates memory after every code change automatically. `End Session` logs the session, runs a drift check, and confirms everything is clean.

---

## Commands (type these in Claude Code)

| Command | What it does |
|---------|-------------|
| `Setup Memory` | First time only — runs setup from inside Claude Code |
| `Start Session` | Load memory, check drift, pick up where you left off |
| `End Session` | Save everything, log the session, run drift check |
| `Check Drift` | Find code changes Claude doesn't know about yet |
| `Analyze Codebase` | Scan all files and update memory automatically |
| `Install Memory` | New computer — scan project and rebuild Claude's knowledge |
| `Generate Skills` | Auto-create skills tailored to your stack |
| `Update Kit` | Pull latest version from GitHub safely |
| `Update Kit from [URL]` | Pull from a specific fork or branch |

---

## How Updating Works

The updater always shows you exactly what will change and asks **"Apply update? [y/N]"** before touching anything. Your memory files, `STATUS.md`, and everything below `## What This Project Is` in `CLAUDE.md` are **never touched**.

### ✅ New install — you have `update.py` in your project root

Type this in Claude Code:

```
Update Kit
```

Want to pull from a specific fork or branch?

```
Update Kit from https://github.com/YehudaFrankel/Claude-Code-memory-starter-kit
Update Kit from https://github.com/YehudaFrankel/Claude-Code-memory-starter-kit/tree/dev
```

### ⚠️ Older install — no `update.py`, but `Update Kit` is in your CLAUDE.md

Type `Update Kit` anyway. Claude detects that `update.py` is missing and automatically runs this:

```bash
python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/Claude-Code-memory-starter-kit/main/update.py').read().decode())"
```

After it runs, `update.py` is saved to your project and you're fully up to date.

### ❌ Very old install — `Update Kit` is not in your CLAUDE.md at all

Claude won't recognize `Update Kit` because that command was added in a later version. Paste this in your terminal from your project root:

```bash
python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/Claude-Code-memory-starter-kit/main/update.py').read().decode())"
```

Or tell Claude to run it — paste this into Claude Code chat:

> Run this in the terminal: `python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/Claude-Code-memory-starter-kit/main/update.py').read().decode())"`

After it runs, your `CLAUDE.md` will have all new commands including `Update Kit`, and `update.py` will be in your project. You're fully up to date.

### From the terminal (any situation)

```bash
# Pull latest from GitHub
python update.py

# Pull from a specific GitHub repo or fork
python update.py https://github.com/YehudaFrankel/Claude-Code-memory-starter-kit

# Pull from a specific branch
python update.py https://github.com/YehudaFrankel/Claude-Code-memory-starter-kit/tree/dev

# Use a local copy of the kit — no internet needed
python update.py /path/to/claude-memory-starter
```

---

## Two Modes

| | Full | Lite |
|---|---|---|
| Memory files | 5 separate files | 1 notes file |
| Drift detection | Script + auto hooks | Manual / none |
| Best for | Multi-file projects | Small/solo projects |
| Can upgrade later? | — | Yes, one prompt |

---

## If Your Session Crashes

Claude Code sessions can die unexpectedly — API errors, large images pasted into chat, context overflow. This kit is built to make that a low-damage event.

**What's always safe:**
- All memory files are on disk — a crashed session never touches them
- `STATUS.md` holds the last known session number and what changed
- `Start Session` rebuilds full context in seconds

**What you could lose:**
- Code changes made *after* the last memory update and *before* the crash

**How to minimize that:**
- Update memory immediately after every code change — the hooks do this automatically
- Run `/compact` when responses start feeling slow — that's context filling up
- Don't wait until `End Session` to save important decisions

**Recovery:**
1. Open a new session
2. Type `Start Session` — Claude reads memory and picks up where you left off
3. Check `STATUS.md` to confirm what was last saved
4. Re-do any changes that happened after the last memory update (drift check will flag missing functions)

---

## Skill Auto-Chain Pattern

Skills can automatically trigger the next skill on pass or fail — no human prompt needed.

Add an `## Auto-Chain` section to the bottom of any `SKILL.md`:

```markdown
## Auto-Chain
- **On pass:** → run `verification-loop`
- **On fail:** → run `debug-resin`, then retry
```

Claude reads this and continues the chain without waiting. Example flow:
```
fix-bug → verification-loop → smoke-test
              ↓ (if fail)
          debug-resin → smoke-test
```

Build your chain by adding `## Auto-Chain` to each skill. Start simple — one next step is enough.

---

## The 3 Guarantees

1. **Memory survives crashes** — files are on disk, not just in the session
2. **Updates are safe** — only the kit commands block gets replaced, never your project content
3. **Drift is caught automatically** — hooks fire after every file edit, not just at End Session

---

## Requirements

- [Claude Code](https://claude.ai/claude-code) — installed and working
- Python 3.7 or newer — free at [python.org/downloads](https://python.org/downloads)
- Nothing else

---

**GitHub:** https://github.com/YehudaFrankel/Claude-Code-memory-starter-kit
