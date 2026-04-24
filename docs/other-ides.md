# Other IDEs and Install Options

Clankbrain is built and tested for Claude Code, and it now also supports Codex by generating `AGENTS.md` alongside `CLAUDE.md`. It also works with Cursor, Windsurf, Warp, and GitHub Copilot — with some limitations on lifecycle hooks.

---

## Install for a specific IDE

```bash
npx clankbrain --ide cursor
npx clankbrain --ide windsurf
npx clankbrain --ide all       <-  all IDEs at once
```

Codex reads `AGENTS.md` natively. Claude Code, Warp, and GitHub Copilot read `CLAUDE.md` natively. Clankbrain now writes both instruction files from the same template.

## What works in each IDE

| | Claude Code | Codex | Cursor | Windsurf | Warp | Copilot |
|---|---|---|---|---|---|---|
| Memory persistence | Full | Full | Full | Full | Full | Full |
| Lifecycle hooks | Full (8 hooks) | Project-level instructions only | Partial | Partial | Limited | Limited |
| Drift detection | Auto after every edit | Via shared project workflow | Manual | Manual | Manual | Manual |
| Session journal | Auto on every Stop | Via shared project workflow | Manual | Manual | Manual | Manual |
| Skills | Full | Full | Full | Full | Full | Full |

Memory persistence — `CLAUDE.md` + `AGENTS.md` + `.claude/memory/` — works across Claude Code, Codex, and the fallback IDEs. Lifecycle hooks still require IDE-level hook support; Claude Code remains the most complete implementation.

---

## Alternate install options

**Git clone:**
```bash
git clone https://github.com/YehudaFrankel/clankbrain.git
cd clankbrain
python setup.py
```

**Python one-liner (no Node required):**
```bash
python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/clankbrain/main/setup.py').read().decode())"
```

**Manual:** Download and run `setup.py` directly from the repo.

**No terminal:** Paste this into Claude Code or Codex chat:
> Analyze this codebase and set up the Claude memory system. Scan all JS, CSS, and backend files. Create CLAUDE.md, STATUS.md, and .claude/memory/ pre-filled with what you find.


