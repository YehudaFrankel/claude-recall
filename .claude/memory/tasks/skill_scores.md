# Skill Effectiveness Scores

_Binary log: did the skill output need correction after firing?_
_Y = needed correction, N = worked correctly first time._
_/evolve reads this to prune weak skills and strengthen strong ones._

| Date | Skill | Used For | Correction Needed | What Failed | Improvement Applied |
|------|-------|----------|-------------------|-------------|---------------------|
<!-- /learn populates this at session end. Be specific in "What Failed" — /evolve uses it to patch the exact step. -->
<!-- Y example: | 2026-01-15 | code-review | pre-ship audit | Y | Missed checking auth on new endpoint | /evolve patched Step 2 to include auth check | -->
<!-- N example: | 2026-01-15 | fix-bug | wrong output on save | N | - | - | -->

---

## Score Summary
<!-- /evolve maintains this table based on the log above -->

| Skill | Times Fired | Success Rate | Status |
|-------|------------|--------------|--------|
