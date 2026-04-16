# Skill: debug-session

**Trigger:** "debug session", "can't figure out why", "weird behavior", "something's wrong with", "why is X not working", "help me debug"

**Description:** Structured debugging flow for any bug or unexpected behavior. Follows reproduce, isolate, hypothesize, fix, verify, log.

**Allowed Tools:** Read, Grep, Glob, Bash, Edit, Write

---

## Steps

1. **Reproduce** — confirm the bug exists. Ask the user to describe exact steps. Run the failing scenario if possible.

2. **Isolate** — narrow down where the bug lives:
   - Which file? Grep for the relevant function/variable.
   - Which line? Read the suspect code.
   - What changed recently? Check git log or ask the user.

3. **Hypothesize** — state ONE clear hypothesis: "I think X is happening because Y."

4. **Fix** — apply the minimal fix. Follow plan-before-edit if the project has that rule.

5. **Verify** — confirm the fix works. Run the scenario again.

6. **Log** — update error-lookup.md (if it exists) with:
   ```
   | Symptom | Root cause | Fix | Date |
   ```
   So the same bug never costs time again.

---

## Notes
- Never skip the reproduce step. "I think I know what's wrong" without reproducing leads to wrong fixes.
- One hypothesis at a time. Don't shotgun 3 changes and hope one works.
- If the fix doesn't work, go back to step 2, not step 4.
