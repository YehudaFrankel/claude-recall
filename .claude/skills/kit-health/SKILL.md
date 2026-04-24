---
name: kit-health
description: Confirms the Clankbrain install worked. Run this right after setup or anytime you suspect something is broken. Triggers on "kit health", "is the kit installed", "kit check", "did install work", "verify kit", "health check kit".
allowed-tools: Read, Glob, Bash
---

# Skill: kit-health

## Trigger
Run after `setup.py` finishes, or anytime the user asks "did install work" / "is the kit healthy" / "kit check".

## What this skill does

Inspects the Clankbrain install, confirms each piece is in place, and reports a green/red status for each. Builds confidence that install succeeded — the most important first impression.

## Steps

1. **Find the kit root.** Either:
   - Current working directory if `.claude/` exists (shared memory root for both apps)
   - Or ask: "Where did you install Clankbrain? (path to project root)"

2. **Check each piece. Report green/red for each.**

   ```
   == Clankbrain Health Check ==

   Memory directory      [check .claude/memory/ exists]
   Skills loaded         [count .claude/skills/*/SKILL.md files]
   Hooks active          [parse .claude/settings.json, count hooks]
   Starter lessons       [check .claude/memory/lessons.md is non-empty]
   Memory index          [check .claude/memory/MEMORY.md exists]
   Settings file         [check .claude/settings.json valid JSON]
   Tools directory       [check tools/ exists with memory.py]
   Sync configured       [check sync.py exists, optional check for git remote]

   Overall: [PASS / FAIL with X issues]
   ```

3. **For each FAIL, give a specific fix:**
   - "Memory directory missing → Run: `python setup.py`"
   - "No skills loaded → Re-run: `python setup.py`"
   - "Settings.json invalid → Restore from `.claude/settings.json.bak`"
   - "No starter lessons → That's okay, but you'll have nothing to demo. Run `tour` to see the kit work with starter content."

4. **End with the next step:**
   ```
   ✓ Install verified.

   Next: Type "tour" for a 5-minute walkthrough,
         or "Start Session" to begin working.
   ```

## How to count skills (Bash)

```bash
ls .claude/skills/*/SKILL.md 2>/dev/null | wc -l
```

## How to verify settings.json (Bash)

```bash
python -c "import json; json.load(open('.claude/settings.json'))" 2>&1
```
Exit 0 = valid. Non-zero = invalid.

## How to count hooks

Read `.claude/settings.json`, count entries in `hooks` object across all hook types (PreToolUse, PostToolUse, Stop, PreCompact, etc.).

## Output format — make it visual

Use ✓ for pass, ✗ for fail, with green/red mental colors via emoji or text formatting.

```
== Clankbrain Health Check ==

✓ Memory directory      .claude/memory/ (12 files)
✓ Skills loaded         32 of 32
✓ Hooks active          8 hooks across 5 events
✓ Starter lessons       3 entries
✓ Memory index          MEMORY.md (118 lines)
✓ Settings file         valid JSON
✓ Tools directory       memory.py present
○ Sync configured       skipped (optional — run `python sync.py setup` to enable)

Overall: PASS — 7/7 required checks green
Optional: 1 skipped (sync — only if you want GitHub backup)

Next: Type "tour" for a 5-minute walkthrough, or "Start Session" to begin.
```

## When something fails

Be specific. Don't just say "broken." Tell the user:
1. What failed
2. Why it matters
3. The exact command to fix it

Example:
```
✗ Skills loaded: 0 of 32 expected
  Why this matters: All the magic is in the skills. Without them, the kit is just a folder.
  Fix: Run `python setup.py --force` to re-install skills.
       If that fails, check that you cloned the full repo (not a sparse checkout).
```

## Why this skill exists

A new user's first 60 seconds with the kit determine whether they keep going. This matters even more now that people may open the same repo in Claude or Codex. Without this skill, install is silent — they don't know if it worked. With this skill, they get instant confirmation + a clear next step.

