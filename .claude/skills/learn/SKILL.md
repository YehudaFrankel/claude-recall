# Skill: learn

**Trigger:** `/learn` or "extract patterns" or "learn from this session"

**Description:** Extracts reusable patterns, lessons, and decisions from the current session and saves them to memory files. Run before End Session or before /compact to capture what was learned.

**Allowed Tools:** Read, Edit, Write, Glob, Grep

---

## Steps

1. **Check `tasks/corrections_queue.md`** — if it has entries, read each one. These are prompts where you were corrected mid-session (auto-captured by hook). Convert each into a lesson entry using the format in step 3, then clear the file back to its header only (keep the two comment lines, delete the `## date` entries).

2. **Review the current conversation for:**
   - Bugs fixed and their root causes
   - Patterns that worked well
   - Mistakes made and how they were corrected
   - Architectural decisions made
   - Stack-specific gotchas discovered

3. **Conflict check before saving:**
   For each new lesson or decision, run:
   ```
   python tools/memory.py --search "[key term from lesson]" --top 3
   ```
   Scan the results for contradictions — existing memory that says the opposite. If found:
   - Show both the old and new entry side by side
   - Ask: "This conflicts with an existing memory. Replace it? (yes / keep both / skip)"
   - If replacing: use `/forget` to invalidate the old entry, then save the new one
   - If keeping both: add a note `(supersedes [old filename])` to the new entry

4. **Categorize findings:**
   - Bugs/errors → append to `.claude/memory/lessons.md` (create if missing)
   - Architectural decisions → append to `.claude/memory/decisions.md` (create if missing)
   - Rejected approaches → append to `tasks/regret.md` (format: `| Date | Approach | Why Rejected |`)
   - Repeated patterns (3+ times) → flag as skill candidate

5. **Format each entry as:**
   ```
   ## [YYYY-MM-DD] - [short title]
   **Context:** what you were doing
   **Problem:** what went wrong or what was learned
   **Solution/Pattern:** what works
   **Apply when:** trigger conditions
   ```

6. **Global lessons check:** For each lesson, ask: "Does this apply beyond this project?" If yes, also append to `~/.claude/global-lessons.md`:
   ```
   ## [YYYY-MM-DD] - [title]
   **Source:** [project name]
   **Pattern:** [what works]
   **Apply when:** [trigger]
   ```

7. **Skill scoring:** Log each skill that fired this session to `tasks/skill_scores.md`:
   - If N (worked correctly): `| [date] | [skill] | [step] | [used for] | N | minor | - | - |`
   - If Y (needed correction): `| [date] | [skill] | [step N] | [used for] | Y | [minor/major/silent] | Step [N]: produced [X], needed [Y]. Fixed by [Z]. | - |`

   The "What Failed" column MUST contain all three:
   - The step number that failed (e.g. "Step 3")
   - What it produced vs what was needed (e.g. "produced INSERT, needed addRow")
   - What the correction was (e.g. "switched to addRow pattern")

   Entries like "didn't work", "needed correction", or "wrong output" are NOT acceptable.
   /evolve cannot patch what it cannot read precisely. If you cannot describe the failure
   in this format, write: `INSUFFICIENT DATA — re-run with more detail before /evolve.`

   Severity guide: `minor` = small correction, close output | `major` = wrong approach, significant rework | `silent` = failure not caught until later

8. **Velocity log:** If this session had an estimated task, append to `tasks/velocity.md`:
   `| [date] | [task] | [estimated] | [actual] | [complexity 1-5] | [notes] |`

9. **After writing:**
   - Report: "Extracted N lessons: [list titles]"
   - If any pattern appeared 3+ times: "Suggest creating skill: [name] — run /evolve to cluster"

---

## Notes

- Never delete existing entries — only append
- Keep entries concise — one lesson per entry
- Run before End Session to preserve session knowledge
- Run before `/compact` to avoid losing insights
- If a pattern recurs across sessions, it belongs in a skill not just lessons.md
