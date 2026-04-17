---
description: Require a written plan and user approval before any code edit
---

# Plan Before Edit — Required for All Code Changes

Before making ANY edit to code files (JS, HTML, CSS, SQL, any backend language), you MUST stop and present a plan. Do NOT apply edits until the user explicitly says to proceed.

**Does NOT apply to:** memory files, `.claude/` rules/skills/settings files.

---

## Step 1 — Validate Before Showing the Plan

Before presenting the plan, verify every function reference:
- Use Grep or Read to confirm each listed function exists at the stated line number
- If a function is not found or the line is wrong, correct it before showing the plan
- Never show a plan with unverified function references — a wrong line number means you read the wrong code

Count lines from the Before/After sections directly — do not estimate. Report the exact count.

---

## Required Plan Format

### Problem / Feature
One clear sentence: what is broken or what needs to be added.

### All Related Functions / Files
List every function and file touched — including callers, callees, frontend/backend pairs. Verified against codebase before showing.
Format: `functionName` — `path/to/file.ext:LINE`

Example:
- `saveUser` — `src/api/users.js:142`
- `retSaveUser` — `src/frontend/userFunctions.js:88`

### Before (relevant lines only)
```
// the current code that will change
```

### After
```
// the replacement code
```

### Why this will work
One sentence explaining the mechanism — not just "this fixes it" but WHY.

### Scope / Blast Radius
- **Files touched:** every file that will change
- **Lines changed:** exact count from Before/After above (not estimated)
- **Type:** Logic change | Refactor (no behavior change) | Config/data only
- **Affected at runtime:** what breaks if this goes wrong (e.g., "all API endpoints fail", "login flow breaks", "CSS only — no runtime impact")

### Rollback
Exact command to undo — Claude will run this if you say "undo":
```
git restore path/to/file.ext
```
(If already committed: `git revert HEAD` or the specific commit hash)

### Evaluation (REQUIRED — honest self-assessment before the user approves)
An honest critique of your own plan. Never skip. Structure:

- **Strong points** — what this plan gets right; what makes it more than a minimal fix. One or two bullets. Use these to justify the approach over simpler alternatives.
- **Risks / things that could go sideways** — every concrete failure mode you can think of. Include: unverified line numbers, assumptions about method signatures, synchronous-vs-async tradeoffs, timezone/locale quirks, UX regressions, silent failure modes. Each with a one-line mitigation or explicit acceptance ("acceptable tradeoff for now because X").
- **Confidence** — `low` / `medium` / `medium-high` / `high`, with a short reason. Never "high" unless every line number is verified AND all external assumptions (method signatures, schema, existing behaviors) have been grep/read-confirmed.
- **Recommend proceeding / hold / redesign** — one-word verdict. If anything above is a blocker, say "hold" and explain what to resolve first. Do not write "proceed" just because you want to move on.

**Why this section is non-negotiable:** the person approving the plan cannot see what you can't see. A two-sentence "evaluation" is the one spot where you transfer hidden risk to them in writing. Without it, every unexpected failure looks like a surprise when really it was a known-unknown you silently accepted. This is the single most valuable piece of the plan rule — it turns a plan from a recipe into a decision.

**Tone rule:** if you wouldn't say it out loud to a senior engineer reviewing this code, don't put it here. No flowery justifications, no CYA hedging, no "may work" when you mean "might break." Concrete or don't bother.

---

## Step 2 — Wait for Approval

Show the plan. Wait for "yes", "go ahead", "do it", or equivalent. Only then edit.

---

## Step 3 — Verify After Every Edit (user must see this)

After applying each edit:
1. Read back the changed lines from the file
2. **Show the user the actual lines** — quote the content, not a summary
3. Confirm it matches the After block: `✓ Verified [file]:[lines] — [quoted content]`
4. If it doesn't match — show the diff and stop immediately

**Do not proceed to the next edit until the user has seen the verification.**
The user is the confirmation — this is not a background check.

---

## Step 4 — Confirm Actual Scope

After all edits are done, if the project is a git repo run:
```
git diff --stat
```
Report actual lines changed vs what the plan stated. If not a git repo, count changed lines manually from what was edited and report the count.

---

## Undo Command

If the user says **"undo"** at any point after an edit:
- **Git repo:** run `git restore path/to/file.ext` — no confirmation needed
- **No git:** restore from the Before block in the plan — re-apply the exact Before content using Edit
- Either way: read back the relevant lines and confirm the file is restored, then report: "Reverted. [file] restored to pre-edit state."

---

## Example

**Problem:** `saveUser` inserts without checking for duplicates — duplicate emails cause a DB constraint error.

**Validation:** Grepped `src/api/users.js` — `saveUser` confirmed at line 142. `retSaveUser` confirmed at `src/frontend/userFunctions.js:88`.

**All Related Functions:**
- `saveUser` — `src/api/users.js:142`
- `retSaveUser` — `src/frontend/userFunctions.js:88`

**Before:**
```javascript
db.query('INSERT INTO users (email, name) VALUES (?, ?)', [email, name]);
```

**After:**
```javascript
const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
if (existing.length) return { error: 'Email already registered' };
db.query('INSERT INTO users (email, name) VALUES (?, ?)', [email, name]);
```

**Why:** The INSERT has no guard — adding a SELECT first catches duplicates before hitting the DB constraint, returning a clean error instead of a 500.

**Scope / Blast Radius:**
- Files touched: `src/api/users.js`
- Lines changed: 3 (exact — counted from Before/After)
- Type: Logic change
- Affected at runtime: signup flow — if the SELECT fails, users get a 500 instead of a duplicate error

**Rollback:** `git restore src/api/users.js`
