# Skill: end-session

**Trigger:** "End Session"

**Description:** Save session progress, extract lessons, update memory, push to GitHub if configured.

**Allowed Tools:** Read, Edit, Write, Glob, Grep, Bash

---

## Steps

1. **Extract lessons** (`/learn`):
   - Review conversation for bugs fixed, patterns discovered, decisions made
   - Check which memory layout exists: `.claude/memory/lessons.md` or `tasks/lessons.md`
   - Append lessons and decisions to whichever files exist

2. **Update STATUS.md** (project root):
   - Increment session number
   - Add one-line summary of what changed

3. **Update MEMORY.md** (`.claude/memory/MEMORY.md`):
   - Set `currentDate` to today's date and session number

4. **Update skill_usage.md** (`tasks/skill_usage.md`):
   - Log which skills fired this session with today's date

5. **Plan drift check**:
   - Glob `plans/` for files marked "Ready to Code" or "In Progress"
   - If output files exist, update plan status to `SHIPPED`

6. **Push memory** (if memory.ps1 exists in project root):
   ```
   powershell -NoProfile -ExecutionPolicy Bypass -File memory.ps1 push
   ```
   Skip silently if memory.ps1 doesn't exist.

7. **Report**:
   ```
   Session complete.

   **Session N** -- [one-line summary]
   **Lessons extracted:** N
   - [one line per lesson]
   **Files touched:** [list]
   ```
