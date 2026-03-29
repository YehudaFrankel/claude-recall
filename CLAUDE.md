# [Project Name] — Claude Code Project Context

> **CLAUDE.md rule:** Only document what Claude would genuinely get wrong without being told — commands, project-specific conventions, non-obvious gotchas. High-level principles ("plan first", "simplicity first") are noise: Claude already knows them and they bloat token use for no gain. Project knowledge (functions, decisions, past bugs) belongs in `.claude/memory/` files. The kit commands above are structured instructions Claude needs — keep them. The project-specific sections below should stay **under 50 lines of actual content**.

---

## Session Commands

### `Setup Memory`
When the user types **"Setup Memory"**, do the following:

1. Check if `setup.py` exists in the current directory
2. If yes — run it: `python setup.py` (or `python3 setup.py`)
3. If no — tell the user to run this one-liner from their project root, then type Setup Memory again:
   ```
   python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/clankbrain/main/install.py').read().decode())"
   ```

### `Start Session`
When the user types **"Start Session"**, do the following:
1. **Check Python** — run `python --version` (or `python3 --version`):
   - Not installed → tell user to download from https://python.org/downloads (check "Add to PATH"), then re-run `Start Session`
   - Installed → proceed
1b. **Check node_modules (silent, self-healing)** — only if `package.json` exists in project root:
   - Run: `node -e "require('fs').existsSync('node_modules') ? process.exit(0) : process.exit(1)"` (or check with Python)
   - If `node_modules/` missing → run `npm install` automatically, print "Installing dependencies..."
   - If present → silent, continue
1c. **Check MCP server** — if the project has an MCP server configured in `.mcp.json`:
   - Verify the MCP tool is available in Claude's tool list
   - If NOT available → warn: "ACTION NEEDED: MCP server not connected. Check `.mcp.json` and re-open Claude Code."
   - If available or no MCP configured → silent, continue
1d. **Check complexity profile** — look for `.claude/memory/complexity_profile.md`:
   - **Missing** → run `python tools/memory.py --complexity-scan --silent` (or `python3`). Surface the output line: *"Project scan: [output]. See `.claude/memory/complexity_profile.md` for full skill recommendations."*
   - **Exists, < 30 days old** → silent, continue
   - **Exists, 30+ days old** → note once: *"Complexity profile is 30+ days old. Run `python tools/complexity_scan.py` to refresh."*
2. Run `python tools/memory.py --check-drift` — check for JS/CSS drift; fix any found (update memory files + sync to bundle)
2b. **Check open plans** — scan `.claude/memory/plans/` for any `.md` file (skip `_template.md`) with `Status: Draft` or `Status: On Hold`. If found, surface: *"Open plan: [name] — Status: [X]. N open questions."* Don't load the full file — just the status line.
3. Read `STATUS.md` — find the current session number and last change
4. Read `.claude/memory/lessons.md` — apply all lessons before touching anything
5. Read `.claude/memory/decisions.md` — understand past architectural choices; don't re-debate settled decisions
6. Read `.claude/memory/tasks/regret.md` — know which approaches were rejected and why; don't re-propose them
7. Read `.claude/memory/tasks/todo.md` — understand current state; if it doesn't exist, create it
8. Report: "Session N ready. Last change: [X]. [N] lessons loaded. What are we working on?"

### `Analyze Codebase`
When the user types **"Analyze Codebase"**, do the following:

1. **Scan JS files** — find all non-minified `.js` files (skip node_modules, vendor, dist); list every top-level function with a one-line description based on what it does
2. **Scan CSS files** — find all non-minified `.css` files; extract all classes with the project prefix; group by feature area
3. **Scan backend** — find Java/Python/Node/Go files; list all public methods and API endpoints
4. **Update memory files** with findings (add MISSING entries only — don't overwrite existing descriptions):
   - `js_functions.md` — new functions found
   - `html_css_reference.md` — new CSS classes found
   - `backend_reference.md` — new endpoints found
5. **Update `tools/memory.py`** — if it exists, make sure JS_FILES and CSS_FILES in the drift-check section include all discovered files
6. **Report** — "Analyzed: [N] JS functions, [N] CSS classes, [N] endpoints. Memory updated."

### `Loop Check`
Use `/loop` to run a recurring memory check automatically:
```
/loop 30m Check Drift
```
This fires `Check Drift` every 30 minutes for the session — no manual prompting needed. Stop it with `/stop-loop` or close the session.

### `Check Drift`
When the user types **"Check Drift"**, do the following:
1. Run `python tools/memory.py --check-drift` (or `python3`) — if the script doesn't exist, manually scan JS files and compare against `js_functions.md`
2. Report what's MISSING (in code, not in memory), what's STALE (in memory, not in code), or "OK — no drift detected"
3. Fix any drift found — update memory files, sync to bundle

### `Search Memory`
When the user types **"Search Memory: [topic]"**, do the following:
1. Run `python tools/memory.py --search "[topic]"` (or add `--top 10` for broader results)
2. Report all matched files with context lines — surface any relevant lessons, decisions, or rejected approaches
3. If results are thin, suggest related terms the user could try

> CLI: `python tools/memory.py --search "auth flow"`

### `Generate Skills`
When the user types **"Generate Skills"**, do the following:

1. **Scan the project** — read CLAUDE.md and memory files to understand the stack, file structure, and patterns in use
2. **Identify what skills would help** — based on what you find:
   - Any project → `fix-bug`, `code-review`
   - Has backend/API → `new-endpoint` or `new-feature`
   - Has a database → `write-query`
   - Has tests → `run-tests`
   - Has CSS/HTML → `security-check`
3. **Create each skill** — for each skill, create `.claude/skills/<name>/SKILL.md` with:
   - Frontmatter: `name`, `description` (when to trigger), `allowed-tools`
   - Body: step-by-step instructions tailored to this project's actual file names, patterns, and conventions
4. **Report** — list every skill created and the phrase that will trigger it

### `Create a skill`
When the user types **"Create a skill called [name] that [description]"**, do the following:

1. Create the folder `.claude/skills/<name>/`
2. Create `SKILL.md` inside it with:
   - `name`: the skill name
   - `description`: when Claude should invoke it (use the user's description as the trigger phrase guide)
   - `allowed-tools`: pick the right tools based on what the skill does (Read/Edit/Grep/Glob/Bash)
   - Body: clear step-by-step instructions for what to do when invoked
3. Confirm: "Skill created. Say '[trigger phrase]' and I'll run it."

### `Update Kit`
When the user types **"Update Kit"** (or **"Update Kit from [URL]"**), do the following:
1. Check if `update.py` exists in the project root
2. If yes — run it via the Bash tool:
   - `Update Kit` → `python update.py`
   - `Update Kit from https://github.com/user/repo` → `python update.py https://github.com/user/repo`
3. If no — fetch and run it in one step using the Bash tool:
   ```
   python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/clankbrain/main/update.py').read().decode())"
   ```
4. The script previews all changes and asks for confirmation before applying anything

### `Debug Session`
When the user types **"Debug Session"** (or **"Debug Session: [description]"**), do the following:
1. **Reproduce first** — confirm the bug is actually happening; don't assume; check logs, run the code, see the failure
2. **Isolate** — narrow down exactly where it breaks (which file, which function, which line)
3. **Hypothesize** — state one specific root cause before touching anything: "I think the issue is X because Y"
4. **Test the hypothesis** — prove or disprove it without changing production code yet
5. **Fix only what's confirmed** — change the minimum code needed to fix the confirmed root cause
6. **Verify** — confirm the fix works AND nothing else broke
7. **Log it** — add one line to `tasks/errors.md`: `[date] | error description | root cause | fix applied`
8. Report: "Bug fixed. Root cause was: [X]. Changed: [files]. Verified: [how]."

### `Code Health`
When the user types **"Code Health"**, do the following:
1. **Scan for debug leftovers** — find any `console.log`, `print(`, `debugger`, `TODO`, `FIXME`, `HACK` across all project JS/backend files
2. **Find hardcoded values** — look for hardcoded URLs, credentials, magic numbers, test IDs
3. **Check error handling** — find functions that could throw but have no try/catch or .catch()
4. **Find dead code** — functions defined but never called; variables declared but never used
5. **Check large files** — flag any file over 500 lines as a refactor candidate
6. **Report findings** in a clean table — file, line number, issue type, severity (low/medium/high)
7. Ask: "Fix any of these now, or just flag for later?"

### `Handoff`
When the user types **"Handoff"**, do the following:
1. Read `STATUS.md`, `tasks/todo.md`, `tasks/decisions.md`, and `.claude/memory/project_status.md`
2. Generate a `HANDOFF.md` in the project root with:
   - **Current state** — what's working, what's not, what's in progress
   - **What to do next** — top 3 tasks in priority order from `todo.md`
   - **Key decisions already made** — pulled from `decisions.md` (don't re-debate these)
   - **Known errors and fixes** — pulled from `errors.md`
   - **Gotchas** — non-obvious things that would trip up someone new
   - **How to start** — exact command to run to get context (`Start Session`)
3. Report: "HANDOFF.md created. Share this file with anyone picking up the project."

### `Estimate`
When the user types **"Estimate: [task description]"**, do the following:
1. **Read the relevant files** — scan whichever files the task would touch
2. **Estimate complexity** — Small (< 1 hour), Medium (1–4 hours), Large (4+ hours)
3. **List files that will change** — every file that will need to be edited
4. **Flag risks** — anything that could go wrong, dependencies that are unclear, assumptions being made
5. **Ask one question** — if anything is ambiguous, ask the single most important clarifying question before starting
6. **Write the plan** to `tasks/todo.md` if the user confirms they want to proceed
7. Report: "Complexity: [size]. Files: [list]. Risks: [list]. Ready to start?"

### `Install Memory`
When the user types **"Install Memory"**, do the following:

1. **Analyze the codebase** — scan all JS, CSS, and backend files to understand what's here:
   - Find all top-level JS functions across all JS files
   - Find all CSS classes (with project prefix) across all CSS files
   - Find all API endpoints / backend methods
2. **Copy bundle to system path** — copy all `.claude/memory/*.md` files to the system memory path:
   - **Mac/Linux:** `~/.claude/projects/[encoded]/memory/`
   - **Windows:** `%USERPROFILE%\.claude\projects\[encoded]\memory\`
   - **How to encode:** replace every `/`, `\`, and `:` with `-`
   - Example: `/home/user/myproject` → `home-user-myproject`
   - Example: `D:\projects\myapp` → `D--projects-myapp`
3. **Fill any gaps** — if `js_functions.md`, `html_css_reference.md`, or `backend_reference.md` are missing entries found in step 1, add them now
4. **Report** — "Memory installed. [N] JS functions, [N] CSS classes documented. Ready."

### `Plan [feature]`
When the user types **"Plan [feature]"**, **"I want to build X"**, **"design X"**, or **"plan mode"**, invoke the `plan` skill:
- Opens or creates `.claude/memory/plans/[slug].md` from the template
- Walks through: problem → research → options → decision → technical spec → open questions
- After every update, reads and displays the **full plan file** — never a summary
- Logs the decision to `decisions.md` the moment it's made
- Flags open questions explicitly before any coding starts

### `Show Plan`
When the user types **"Show Plan"** or **"show me the plan"**, read and display the full contents of the most recently edited file in `.claude/memory/plans/` — no summary, full file.

### `End Session`
When the user types **"End Session"**, do the following:
> **Tip:** If this session ran long, type `/compact` first to summarize the conversation before ending. This keeps context clean and prevents the next session from starting with a bloated history.
1. Run `/learn` — extract patterns, lessons, and decisions from this session into `tasks/lessons.md` and `tasks/decisions.md` before saving anything
2. Update `STATUS.md` — increment session number, add one-line entry: date + what changed
3. Update all relevant memory files in `.claude/memory/` for anything changed this session:
   - JS changed → update `js_functions.md`
   - HTML/CSS changed → update `html_css_reference.md`
   - Backend/API changed → update `backend_reference.md`
   - Phase or architecture change → update `project_status.md`
   - New rules or gotchas → update `user_preferences.md`
   - Update `currentDate` in `.claude/memory/MEMORY.md` to today's date
4. **Scan plans/** — for each `.claude/memory/plans/*.md` (skip `_template.md`):
   - If status moved to `Ready to Code` this session → confirm it's logged in `decisions.md`
   - If status is `On Hold` → note in STATUS.md summary
   - If status is `Draft` with open questions → list them in the End Session report
5. Run drift check to confirm everything is clean
6. Report: "Session N complete. Updated: [list]. Plans: [any open]. Memory clean."

> **Memory stays local by default.** Nothing is pushed anywhere. To sync across machines, see `Advanced: Cross-Machine Sync` below.

---

## Plan Auto-Display Rule

After **any edit** to a file in `.claude/memory/plans/` (except `_template.md`) — immediately read the file and display the **full contents**. Never show a diff or summary. The user should never need to ask "show me the plan."

This applies to every plan update, every option added, every decision made, every open question resolved.

---

## Auto-Save Rule

After **any code change** this session, immediately update the relevant memory file — don't wait for `End Session`:

| What changed | Update this file |
|---|---|
| JavaScript function added or changed | `js_functions.md` |
| HTML element or CSS class added or changed | `html_css_reference.md` |
| Endpoint or backend method added or changed | `backend_reference.md` |
| Architecture decision or non-obvious gotcha | `project_status.md` |
| Chose approach A over B for a reason | `.claude/memory/decisions.md` |
| Fixed a runtime error / bug | `.claude/memory/tasks/regret.md` |
| Any code change when a code-map exists | `code-map.md` — update affected flow, line number, or DB entry |

### Code Map Self-Update Rule
If the project has a `code-map.md` (a file mapping features → code paths → line numbers), update it **immediately** after every code change:
- **New method added** → add row with name, line number, purpose
- **Method moved / line numbers shifted** → update affected line numbers
- **New endpoint** → add flow entry: URL → JS → endpoint name → logic method [line] → DB
- **JS function renamed or added** → update its JS entry in the relevant flow
- **New table or column** → update DB read/write lines in affected flows
- **Behavior changed** → update the purpose description

An outdated code-map causes the same slowdown as having no code-map.

`End Session` handles `STATUS.md`, the full drift check, and confirms everything is clean.

---

## Autonomous Behaviors

These run automatically — no prompt needed.

### Skill Chaining
Skills can trigger the next skill on pass or fail. Add `## Auto-Chain` to any `SKILL.md`:
```markdown
## Auto-Chain
- **On pass:** → run `verification-loop`
- **On fail:** → run `debug-[topic]`, then retry
```
Claude reads this and continues the chain without waiting. Build chains for your most common multi-step flows.

### Self-Healing on Failure
When a skill's smoke/verify step fails:
1. Claude attempts the minimal fix autonomously (e.g. touch file, clear cache)
2. Retries the check once
3. Only escalates to you if the second attempt also fails

Add a `## Recovery` section to any skill to define what "minimal fix" means for that skill.

### Unsaved Memory Reminder
The stop hook monitors every response. When memory files have unsaved changes, it surfaces a reminder to run `End Session` — so you never accidentally close a session without saving. Works with or without git.

### Compound Learning Loop
```
session work → /learn (extract lessons + score skills)
                     ↓
              skill_scores.md (Y/N per skill)
                     ↓
              /evolve (patch failing skills, cluster patterns)
                     ↓
              better skills next session
```
Run `/learn` before `End Session`. Run `/evolve` when lessons accumulate (every 3-5 sessions).

---

> **Context tip:** Long session? Run `/learn` then `/compact` — the PreCompact hook reinjects memory automatically. If a session crashes, type `Start Session` in a new session — picks up where you left off.

---

## Advanced: Cross-Machine Sync (opt-in)

Memory is local by default. Nothing is pushed anywhere unless you set this up.

### `Setup Sync`
When the user types **"Setup Sync"** or **"Setup Sync: [repo URL]"**, do the following:
1. If no URL provided — ask: "What's the URL of your private GitHub repo for memory? (Create one at github.com/new — make it private)"
2. Run: `python sync.py setup [repo-url]`
3. If it fails with an auth error — tell the user to run `gh auth login` first, then retry
4. Report: "Sync enabled. Memory will push to [repo]. Run `Sync Memory` after each session, or `Pull Memory` on a new machine."

### `Sync Memory`
When the user types **"Sync Memory"**, do the following:
1. Run: `python sync.py push`
2. Report the result — "Memory synced" or surface the error

### `Pull Memory`
When the user types **"Pull Memory"**, do the following:
1. Run: `python sync.py pull`
2. Report: "Memory pulled — you're up to date" or surface the error

### `Sync Status`
When the user types **"Sync Status"**, do the following:
1. Run: `python sync.py status`
2. Report what it returns

> **Kit code always flows one way: clankbrain → your machine.** Nothing is ever pushed back to clankbrain. Sync goes to your own private repo — you own it, you control it.

---

## What This Project Is
<!-- One paragraph: what it does, who uses it, what problem it solves -->

---

## Tech Stack
- **Backend:** <!-- e.g. Java / Node / Python / Go -->
- **Frontend:** <!-- e.g. Vanilla JS / React / Vue -->
- **Database:** <!-- e.g. SQL Server / PostgreSQL / SQLite -->
- **Other:** <!-- e.g. email, scheduling, auth -->

---

## File Paths
<!-- List the key files Claude will touch most often -->

| File | Purpose |
|------|---------|
| `src/...` | |
| `css/...` | |
| `js/...` | |

---

## Coding Conventions

### Adding an Endpoint / Route
<!-- Step-by-step: where to register, where to implement, how to read params -->

### DB Patterns
<!-- How to query, insert, update — framework-specific helpers, what to avoid -->

### Frontend API Calls
<!-- How JS calls the backend — fetch wrapper, promise pattern, etc. -->

---

## Design System

### Colors
```css
/* Paste your CSS variables here */
```

### Principles
<!-- Mobile-first? No external deps? Specific component patterns? -->

---

## Notes / Deviations
<!-- Gotchas, non-obvious choices, things that would trip up a new dev -->

---

## Verification Checklist
<!-- Manual smoke tests to run after a session's changes -->
- [ ]
- [ ]

---

## Session Starter Prompt
> "Read CLAUDE.md and STATUS.md. We're continuing [Project Name]. Check which phases are complete and let's pick up where we left off."
