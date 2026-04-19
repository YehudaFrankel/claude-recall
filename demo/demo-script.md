# demo.gif — Recording Script

**Target length:** 30–45 seconds
**Terminal size:** 120×30
**Font size:** 16px
**Tool:** [Terminalizer](https://github.com/faressoft/terminalizer) or [Asciinema](https://asciinema.org/) + convert to GIF

---

## The flow to show

This script demonstrates the full compound learning loop:
`debug-session` → auto-chains to `verification-loop` → `--suggest-guards` fires → `team push` shares it.

### Scene 1 — Session start (3s)
```
$ # Open Claude Code, type:
Start Session

# Claude responds:
Session 12 ready. Last change: fixed scheduler race condition.
14 lessons loaded. 6 known errors active.
Team sync: +2 new entries from team (error-lookup.md).
What are we working on?
```

### Scene 2 — Debug session triggers (8s)
```
$ # User types:
debug session — dashboard not loading after login

# Claude runs Step 1 — checks error-lookup.md
# No match found. Proceeds to reproduce...
# Step 5 — fix applied (Edit tool fires)

# verification-loop auto-chains immediately:
Running verification-loop...
✓ Build: no errors
✓ Smoke test: dashboard loads in 340ms
✓ Adjacent routes: unaffected
Verification passed.
```

### Scene 3 — suggest-guards hook fires (5s)
```
# --suggest-guards PostToolUse hook fires automatically:
error-lookup.md updated (7 known errors now logged).
Error logged. Run Generate Guards to turn this into automated
prevention? I can scan your full error history and propose
guards in about 30 seconds. Say yes to run it now.

$ yes

# Guard proposed and written to guard-patterns.md:
[PASS] NULL_BEFORE_ACCESS
[PASS] HARDCODED_URL
+ NEW: SESSION_TOKEN_MISSING — guards against missing auth
  header on dashboard load (from error logged today)
```

### Scene 4 — Team push shares everything (5s)
```
$ Team Push

Pushing team memory...
Pushed 6 team file(s) to github.com/team/shared-memory
  error-lookup.md: +1 new entry
  guard-patterns.md: +1 new guard
Done.

# Teammate's next Start Session will get these automatically.
```

### Scene 5 — Progress report closes the loop (5s)
```
$ Progress Report

=== Clankbrain Progress Report ===

  Sessions logged         12
  Lessons accumulated     19  ← run /mine-patterns to cluster
  Known errors logged     7   ← debug-session stops repeating
  Rejected approaches     11  ← regret-guard blocks these
  Skill accuracy          81%  (24 correct / 6 corrected)
  Velocity data points    14

  → 12 sessions in. Compounding is happening.
```

---

## Recording notes

- Use a dark theme (matches the site's `#08091a` background)
- Pause 0.5s between each scene for readability
- The auto-chain in Scene 2 should feel instant — no pause between fix and verify
- The suggest-guards in Scene 3 should feel like it interrupted naturally (it did — it's a PostToolUse hook)
- End on the Progress Report — it's the proof

## File output

Replace `demo.gif` in the repo root. Add `?v=3` to the README img tag to bust cache:
```markdown
![Session demo](demo.gif?v=3)
```
