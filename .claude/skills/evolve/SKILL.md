# Skill: evolve

**Trigger:** `/evolve` or "evolve lessons into skills" or "cluster patterns into skills"

**Description:** Reviews accumulated lessons.md entries, identifies repeated patterns, and proposes or creates new reusable skills. Turns hard-won session knowledge into formalized, reusable workflow.

**Allowed Tools:** Read, Edit, Write, Glob, Bash

---

## Steps

0. **Preview mode (default):**
   Before making any changes, show a summary of what would happen:
   - Skills that would be patched (name, step number, what would change)
   - New skills that would be created (pattern, frequency)
   Ask: "Apply these changes? [y/N]"
   Only proceed on explicit yes.

1. **Read memory files:**
   - `.claude/memory/lessons.md`
   - `.claude/memory/decisions.md` (if exists)

2. **Identify repeated patterns:**
   - Look for entries with the same root cause or "Apply when" condition
   - Flag patterns that appear 2+ times across sessions

3. **Check for existing skill coverage:**
   - List all skills in `.claude/skills/`
   - For each repeated pattern, check if an existing skill already covers it

4. **For uncovered repeated patterns, propose:**

   Pattern: [description]
   Appeared: N times
   Suggested skill name: [name]
   Create it? (yes/no)

5. **On confirmation, create the skill:**
   - Create `.claude/skills/[name]/SKILL.md`
   - Include: trigger phrase, description, allowed tools, step-by-step instructions, notes
   - Make steps specific to your actual stack and patterns

6. **Report:** "Created N new skills: [list]"

---

## Phase 3: Compound Learning Loop — Self-Improving Skills

Run this phase every time `/evolve` is called, after Phase 2.

### Step A — Find failing skills
Read `tasks/skill_scores.md`. Find all rows where:
- `Correction Needed = Y`
- `Improvement Applied = -` (not yet fixed)

### Step B — For each failing skill
1. Read the skill's SKILL.md at `.claude/skills/[name]/SKILL.md`
2. Read the "What Failed" description from skill_scores.md
3. Identify which step caused the failure
4. Rewrite that step to prevent the same failure — be specific, not generic
5. Add an improvement note at the bottom of the changed step:

   [YYYY-MM-DD] Improved: [one line — what changed and why]

6. Save the updated SKILL.md

### Step C — Log the improvement
Append to `tasks/skill_improvements.md`:

| [date] | [skill] | Step N | [what failed before] | [what was fixed] | skill_scores row [date] |

Update the `skill_scores.md` row: change `Improvement Applied` from `-` to `Fixed [date]`.

### Step D — Report

Compound Learning: patched N skills
- [skill name]: Step [N] — [one line summary of what changed]

---

## Relationship Types for Decisions
When /evolve detects that a new decision supersedes, explains, or exemplifies an existing one, flag it:
- `supersedes` — new decision replaces an old one
- `explains` — new decision clarifies why an old one was made
- `example-of` — new decision is a concrete instance of a general pattern

Add the appropriate `Relates to:` field when writing to decisions.md.

---

## Skill File Format

# Skill: [name]

**Trigger:** [exact phrase(s) that invoke this skill]

**Description:** [one sentence — what it does and when to use it]

**Allowed Tools:** Read, Edit, Write, Glob, Grep, Bash

---

## Steps
1. ...
2. ...

## Notes
- ...

---

## Notes

- Only create skills for patterns with clear, repeatable trigger conditions
- Generic advice ("always test") doesn't make a good skill — specific workflows do
- Run `/learn` before `/evolve` to ensure latest session patterns are captured
- After creating skills, update MEMORY.md index if your project uses one
- Default to preview mode — never patch skills without explicit confirmation
