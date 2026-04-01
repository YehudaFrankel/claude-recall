---
description: Keep code-map.md and memory files in sync after every code edit
globs:
  - "**/*.js"
  - "**/*.ts"
  - "**/*.java"
  - "**/*.py"
  - "**/*.html"
  - "**/*.css"
  - "**/*.sql"
alwaysApply: false
---

# Update Code Map — After Every Code Change

After ANY code change — JS, backend, CSS, SQL, HTML — check whether memory needs updating and update it immediately. Do not wait until End Session.

---

## What to update

**After adding a function or method:**
- Add it to `js_functions.md` / `backend_reference.md` with a one-line description of what it does
- If it's a new API endpoint, add the full flow: JS function → endpoint → logic → DB

**After removing or renaming a function:**
- Remove or rename the corresponding entry in all memory files
- If it appeared in a flow diagram or code map, update those too

**After adding a DB table or column:**
- Update `backend_reference.md` DB section with the table name, purpose, and key columns
- Note any insert/update quirks (IDENTITY, nullable columns, required audit fields)

**After adding a new page or URL:**
- Add it to the URL patterns section in the relevant memory file

**After any schema or flow change:**
- Update `agreed-flow.md` if a user journey changed
- Update `decisions.md` if an architectural choice was made

---

## Rule

The drift detector catches JS functions and CSS classes automatically.
Everything else — endpoints, DB tables, flows, config — requires you.

An outdated memory file is worse than no memory file.
It causes Claude to confidently suggest things that are wrong.
