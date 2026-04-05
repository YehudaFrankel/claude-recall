# Memory Index

- [User preferences and working style](user_preferences.md) — Communication style, things to avoid, update rules
- [Project status](project_status.md) — Completed phases, key decisions, current session number
- [JS functions reference](js_functions.md) — All functions across all JS files with descriptions
- [HTML & CSS reference](html_css_reference.md) — Page section IDs, component IDs, CSS classes
- [Backend reference](backend_reference.md) — API endpoints, DB patterns, utility methods
- [Lessons Learned](lessons.md) — Patterns + fixes extracted by /learn. Applied at every Start Session.
- [Architectural Decisions](decisions.md) — Settled decisions. Claude reads before proposing solutions.
- [Regret Log](tasks/regret.md) — Rejected approaches + why. Claude reads before proposing to avoid re-proposing discarded ideas.
- [Error Lookup](error-lookup.md) — Known errors → exact cause → exact fix. Never debug the same error twice.
- [Critical Notes](critical-notes.md) — Non-obvious gotchas that aren't decisions or regrets but will cost time if unknown.
- [Agreed Flows](agreed-flow.md) — User journeys locked by explicit agreement. Do not change without discussion.
- [Velocity Tracker](tasks/velocity.md) — Estimated vs actual sessions. Claude reads for self-calibrating estimates.
- [Todo](tasks/todo.md) — Current tasks in priority order. Updated at Start Session and End Session.
- [Skill Scores](tasks/skill_scores.md) — Skill effectiveness log. /evolve reads to prune weak skills.
- [Plans](plans/) — Feature plans. Each plan: problem, options, decision, technical spec, open questions. Check status at Start Session.
- [Complexity Profile](complexity_profile.md) — Auto-generated on first Start Session. Stack, complexity score, recommended skills. Rescan: delete and run Start Session.
- [Global Lessons](~/.claude/global-lessons.md) — Cross-project discoveries. Loaded last, after all project-specific files.

# Memory Loading Order
Project-specific files load first. Global lessons load last.
This ensures project context surfaces before cross-project patterns.

# currentDate
<!-- Update this each session -->
Today's date is [YYYY-MM-DD].
