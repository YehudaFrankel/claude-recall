## FAQ

**What Claude plan do I need?**
Any paid plan that includes Claude Code. The kit is just markdown files and Python scripts running on your machine. If your sessions are getting long, Max helps with context limits, but the PreCompact hook and Start Session recovery are specifically built to handle that gracefully on any plan.

**Do I need to understand how it all works?**
No. Start Session and End Session are the whole daily interface. Everything else runs automatically or responds to plain English. You don't need to read the docs to use it.

**Does it work with my stack?**
Yes. Setup detects your stack and configures everything for what you're actually using. Java, Python, Node, Go, Ruby, any language with source files works.

**What is user_preferences.md for?**
It's where Claude learns how you like to work. Your tone preferences, things you never want it to do, coding conventions specific to you. Add anything like "always ask before refactoring" or "I prefer short responses". It loads automatically every session.

**What is global-lessons.md for?**
Lessons that apply across all your projects, not just one. Lives at `~/.claude/global-lessons.md` and loads at every Start Session regardless of which project you're in. Good for things like "always check .env before debugging auth issues."

**What does session_journal.md give me?**
A searchable history of everything you've worked on. Timestamped automatically, you never write to it. Just grep it and Claude surfaces every session where you touched a specific topic.

**What does bootstrap do?**
Scans your entire project and builds `quick_index.md`, a map of every source file grouped by type. Run it once on any new project and Claude has immediate codebase awareness without you documenting anything manually.

**Does this work with Anthropic's native Auto Memory?**
Yes and they don't overlap. Auto Memory captures conversational context within a session. Clankbrain persists project knowledge across sessions including architecture decisions, lessons from past mistakes, and custom workflows. Auto Memory forgets when the session closes. Clankbrain doesn't. Run both.

**Why markdown files instead of a database?**
Because you can read them, grep them, diff them, and restore any version from git history without any tooling. A database is opaque. Markdown files travel with your repo, work on any machine, and never need an API key or running service. The simplicity is the point.

**Does a big CLAUDE.md actually help?**
No. Large CLAUDE.md files increase token use by around 20% with marginal or negative improvement in output quality. Clankbrain is built the opposite way. CLAUDE.md stays lean and project knowledge lives in separate memory files that load selectively. The project-specific section is designed to stay under 50 lines.

**Is this safe for business use?**
Clankbrain doesn't touch your data. Memory stays on your machine. Kit updates flow one way only from Clankbrain to you, never the reverse. Anonymous usage stats are sent to PostHog on setup and session start (mode, platform, Python version — no project data, no code, no file paths). Opt out at any time with `CLANKBRAIN_NO_TELEMETRY=1`. The real data consideration for businesses is Claude Code itself sending prompts to Anthropic — that's true regardless of this kit. For regulated industries get an Anthropic enterprise plan with a BAA. Clankbrain adds nothing to that surface. Memory files are local, contain code patterns and decisions not personal data, and are fully under your control.