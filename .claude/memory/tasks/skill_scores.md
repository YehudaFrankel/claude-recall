# Skill Effectiveness Scores

_Step-level log: did the skill output need correction after firing?_
_Y = needed correction, N = worked correctly first time._
_/evolve reads this to patch failing steps. /evolve-check reads this to surface urgent skills._

| Date | Skill | Step | Used For | Correction Needed | Severity | What Failed | Improvement Applied |
|------|-------|------|----------|-------------------|----------|-------------|---------------------|
<!-- /learn populates this at session end. Step = which step fired. Severity = minor/major/silent. -->
<!-- Y format: | 2026-01-15 | code-review | Step 2 | pre-ship audit | Y | major | Step 2: produced generic check, needed auth endpoint check. Fixed by adding auth scan to step 2. | - | -->
<!-- N format: | 2026-01-15 | fix-bug | Step 1 | wrong output on save | N | minor | - | - | -->
<!-- VAGUE (unusable): | 2026-01-15 | fix-bug | ? | something | Y | ? | INSUFFICIENT DATA — re-run with more detail before /evolve. | - | -->

---

## Score Summary
<!-- /evolve maintains this table based on the log above -->

| Skill | Times Fired | Y Count | Success Rate | Status |
|-------|------------|---------|--------------|--------|
