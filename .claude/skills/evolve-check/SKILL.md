# Skill: evolve-check

**Trigger:** "evolve check", "check evolve", "which skills need evolving", "evolve status", "skill health"

**Description:** Reads skill_scores.md and surfaces which skills are ready for /evolve. Analysis only — no patching, no file changes.

**Allowed Tools:** Read, Glob

---

## Steps

1. **Read `tasks/skill_scores.md`** — load all data rows. If the table is empty, report:
   "No skill scores logged yet. Run /learn at the end of sessions to populate skill_scores.md."
   Then stop.

2. **Group by skill name.** For each skill compute:
   - Total fires (all rows for this skill)
   - Y count (Correction Needed = Y)
   - N count (Correction Needed = N)
   - Consecutive Y streak — count from the most recent row backwards until an N is hit
   - Whether any Y entries have "INSUFFICIENT DATA" or vague "What Failed" (no step number)

3. **Classify each skill:**
   - 🔴 **URGENT** — 3+ Y scores, OR 2+ consecutive Y scores on the same step
   - 🟡 **WATCH** — exactly 2 Y scores (threshold met, ready for /evolve)
   - 🟢 **STABLE** — 0 or 1 Y score, or 10+ consecutive N scores
   - ⚠️ **DATA MISSING** — has Y entries but "What Failed" is vague or marked INSUFFICIENT DATA

4. **Output the report:**

   ```
   === Evolve Check ===

   🔴 URGENT — patch now
     [skill] — [Y count] failures, [streak] consecutive on Step [N]
     Latest failure: "[verbatim What Failed entry]"

   🟡 WATCH — ready for /evolve
     [skill] — 2 Y entries ([dates])
     Failures: Step [N] / Step [N]

   🟢 STABLE
     [skill] — [N count] clean sessions

   ⚠️ DATA MISSING — cannot evolve yet
     [skill] — Y logged but "What Failed" too vague to patch
     Action: next failure, log as: Step [N]: produced [X], needed [Y]. Fixed by [Z].

   ---
   [N] skills flagged.
   Run /evolve on flagged skills now? [y/N]
   ```

5. **Stop.** Do not patch anything. Do not modify any files. Do not call /evolve automatically.

---

## Notes

- This is a read-only diagnostic — it surfaces signals, never acts on them
- Run at End Session to catch urgent skills before the session closes
- /evolve does the actual patching — this just tells you when to run it
- A skill with alternating Y/N is not stable — the previous fix didn't hold; flag it manually
