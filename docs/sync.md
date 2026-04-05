# Cross-Machine Sync and Team Sync

Memory lives in `.claude/memory/` on your machine by default. Nothing leaves unless you explicitly set this up.

---

## Cross-machine sync

If you work across multiple machines — or want a backup — sync memory to your own private GitHub repo.

### Setup (once)

Create a private repo at github.com/new, then in Claude Code:

```
Setup Sync: https://github.com/you/my-memory
```

Or from terminal:

```bash
python sync.py setup https://github.com/you/my-memory
```

### Day to day

```
Sync Memory    <-  push memory after End Session
Pull Memory    <-  pull on a new machine
Sync Status    <-  check if anything is unpushed
```

Or from terminal: `python sync.py push` / `python sync.py pull`

### On a new machine

```bash
git clone https://github.com/you/your-project
python sync.py pull
```

Open Claude Code and type `Start Session` — fully up to speed.

---

## Team sync

One person's `error-lookup.md` entry benefits the whole team. One person's `decisions.md` means nobody re-debates the same thing. One person's session learnings in `lessons.md` — yours, automatically, next Start Session.

Team Sync shares memory files across your team via a single private git repo. Personal memory (velocity, journal, skill scores) stays local.

### What gets shared

| File | Why |
|------|-----|
| `decisions.md` | The team can't re-debate what the team already settled |
| `lessons.md` | Every session's learnings benefit everyone — not just the person who had the session |
| `regret.md` | Rejected approaches are codebase-wide, not per-person |
| `error-lookup.md` | One person debugs it once — zero cost for everyone else |
| `critical-notes.md` | Gotchas cost time regardless of who hits them |
| `agreed-flow.md` | User journeys are team agreements |
| `guard-patterns.md` | Guards protect the whole codebase |
| `complexity_profile.md` | Shared codebase profile — no need for each person to scan |

Personal files that never leave your machine: `velocity.md`, `skill_scores.md`, `user_preferences.md`, `session_journal.md`, `todo.md`.

### Setup — manager does this once

Create a **private** repo at github.com/new. Then in Claude Code:

```
Setup Team: https://github.com/team/shared-memory
```

This seeds the shared repo with your current memory files and prints the join URL to share with teammates.

**Prerequisite:** `gh auth status` — git must be authenticated. If not: `gh auth login`.

### Joining — each new member does this once

Paste the URL your manager sent you:

```
Join Team: https://github.com/team/shared-memory
```

This clones the shared repo, shows you what's in it (file names + line counts), and asks before merging anything into your local memory. Nothing overwrites without your confirmation.

### Day to day

```
Start Session  ->  team memory pulls automatically (nothing to type)
End Session    ->  Team Push   (share what you found with the team)
Team Status    ->  check last sync times and recent commits
```

Merge is append-only, keyed by first column — no git conflicts possible.

---

## Why sync is safe

**Your repo, your rules.** Memory goes to a private GitHub repo you create and own. Clankbrain never sees it, never touches it, has no access to it. Delete the repo at any time.

**Kit code flows one way.** Updates are pulled from Clankbrain to your machine — nothing ever goes the other direction.

**Plain text, fully auditable.** Memory files are markdown. Read them, diff them, review them in a PR, restore any version from git history. Nothing is encoded or opaque.

**What's in memory files:** lessons from past sessions, architectural decisions, rejected approaches, function names, project status. No passwords. No customer data. No credentials. If something sensitive accidentally ends up in a memory file, you own that file and can delete or edit it — it's a text file.

**Self-hosted option.** Replace GitHub with GitLab, Bitbucket, or any on-prem git server. `sync.py` works with any git remote — just swap the URL.

**Anthropic's role.** Clankbrain memory is local. Claude Code sends your prompts to Anthropic — that's separate from this kit. For regulated industries, use an Anthropic enterprise plan with a signed BAA. Clankbrain adds nothing to that data surface.

**GDPR.** Clankbrain processes no personal data. Memory files are stored locally and contain code patterns and decisions — not personal data. For stricter requirements, keep memory local and off git entirely.
