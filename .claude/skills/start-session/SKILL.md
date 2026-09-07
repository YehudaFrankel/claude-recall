# Skill: start-session

**Trigger:** "Start Session"

**Description:** Initialize a working session with full project context.

**Allowed Tools:** Read, Glob, Grep

---

## Steps

1. Read `STATUS.md` (project root) - get last session summary
2. Read `.claude/memory/MEMORY.md` - get current context
3. **First-session auto-scan (MANDATORY -- do not skip):**
   - Glob for `.claude/rules/code-map.md`
   - If it does NOT exist OR contains "Placeholder": run `/scan-codebase` immediately. Do not ask, do not report "Ready" first, do not proceed to step 4 until the scan completes and all rule files are written.
   - This is blocking -- the session cannot start without project-specific rules. Generic template files are wrong for most projects and must be replaced by scan-codebase before any work begins.
4. Report: "Ready. Last change: [summary]. What are we working on?"
5. Add one observation if worth noting (optional, max one line)
