# The Learning Loop in Practice — A Real Case Study

This is a real example from 160 sessions on a Java/SQL production codebase.
The skill is `new-endpoint`. It failed at the same step twice. `/evolve` patched it.

---

## What the data looks like after two failures

**`tasks/skill_scores.md` (excerpt):**

```
| Date       | Skill        | Step   | Used For                          | Correction Needed | Severity | What Failed                                                                               | Improvement Applied |
|------------|--------------|--------|-----------------------------------|-------------------|----------|-------------------------------------------------------------------------------------------|---------------------|
| 2024-11-14 | new-endpoint | step 4 | Add appCourseGetCheckin endpoint  | N                 | minor    | -                                                                                         | -                   |
| 2024-11-21 | new-endpoint | step 4 | Add appAdminSendReminder endpoint | Y                 | major    | Step 4: produced SELECT * in getOnlyMetaData, needed explicit column list. Fixed by: rewrote SELECT with all columns named. | - |
| 2024-12-03 | new-endpoint | step 4 | Add appAdminGetMessages endpoint  | Y                 | major    | Step 4: produced SELECT * in getOnlyMetaData, needed explicit column list. Fixed by: rewrote SELECT with all columns named. | - |
| 2024-12-09 | new-endpoint | step 6 | Add appCourseMarkComplete endpoint| N                 | minor    | -                                                                                         | -                   |
```

Two Y entries. Same step. Same failure. That's the signal.

---

## What /evolve-check surfaces

```
/evolve-check

Skill Health Report
───────────────────────────────────────

🔴 URGENT — new-endpoint
   2 failures at step 4 — same issue twice
   Step 4: SELECT * in getOnlyMetaData → IDENTITY column included → addRow fails
   Ready to patch.

🟢 STABLE — plan
   4 uses, 0 corrections

🟢 STABLE — learn
   6 uses, 1 minor correction (different steps each time — noise, not pattern)

🟡 WATCH — smoke-test
   1 failure at step 2 — too early to patch (need 2+ failures at same step)
```

Takes 5 seconds. No files changed.

---

## What /evolve does with the data

It reads the two Y entries for `new-endpoint`. Both say "Step 4: produced SELECT *, needed explicit column list."

It opens the skill and finds Step 4. Before patching:

```markdown
### Step 4 — Build the UTable query

Use getOnlyMetaData with a SELECT to load the table structure.

Example:
  t.getOnlyMetaData("SELECT * FROM ch_CourseSession WHERE 1=2");
```

After patching:

```markdown
### Step 4 — Build the UTable query

Use getOnlyMetaData with an EXPLICIT column list — never SELECT *.
SELECT * pulls IDENTITY columns into metadata → addRow tries to INSERT
an explicit PK value → SQL Server error.

Example:
  t.getOnlyMetaData("SELECT CourseID, SessionNumber, SessionTitle,
    SessionContent, CreatedOn, OrganizationID FROM ch_CourseSession WHERE 1=2");

⚠ Pattern from 2 failures (2024-11-21, 2024-12-03):
  Always list every column except the IDENTITY PK explicitly.
```

It also writes to `tasks/skill_improvements.md`:

```
| 2024-12-10 | new-endpoint | step 4 | 2 failures (same step) | Rewrote example: SELECT * → explicit column list. Added identity column warning. |
```

---

## What happens on the next use

Session 7 weeks later. Adding a new endpoint. The skill fires.

Step 4 now shows the explicit column example and the warning. Claude writes the correct query first time. No correction needed. N entry in skill_scores.md.

The failure stops repeating.

---

## The compound effect by session 30

After 30 sessions on the same codebase:

- `new-endpoint` patched 2 times — Step 4 (identity column) and Step 6 (noCheckSessionFunc array)
- `fix-bug` patched 1 time — Step 3 (hypothesis before grep, not after)
- `learn` patched 0 times — still stable
- `smoke-test` patched 1 time — Step 2 (check Resin log before testing endpoint)

A generic skill becomes a skill that knows your stack's specific failure modes.

---

## The three habits that make it compound

1. **End Session every time** — `/learn` gathers the data. Skip it and the loop breaks.
2. **Run `/evolve-check` when you want to know what needs attention** — takes 5 seconds, read-only.
3. **Run `/evolve` when skills are flagged** — patches the specific steps with real failure data behind every change.

That's the whole system.
