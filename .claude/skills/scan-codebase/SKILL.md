# Skill: scan-codebase

**Trigger:** `/scan-codebase` or "scan the codebase" or "analyze the project" or "generate rules from code"

**Description:** Scans the current project and generates project-specific rules by reading actual code patterns, file structure, and conventions. Run automatically on first Start Session if no code-map exists.

**Allowed Tools:** Read, Glob, Grep, Write, Bash

---

## Steps

### 1. Discover Project Structure
- Glob for all source files: `**/*.java`, `**/*.js`, `**/*.ts`, `**/*.py`, `**/*.go`, `**/*.html`, `**/*.css`, `**/*.sql`, config files
- Read package/build config (`pom.xml`, `package.json`, `go.mod`, `requirements.txt`, etc.) for dependencies
- Identify entry points, main directories, test directories
- Count files per directory to understand project shape

### 2. Sample Code Patterns (read 5-10 representative files)
- Pick the largest files (likely core logic)
- Pick files from different directories (coverage)
- For each file, extract:
  - Naming conventions (variables, functions, classes, files)
  - Import/require patterns
  - Error handling patterns
  - Comment style and density
  - Indentation (tabs vs spaces, width)
  - String quote style (single vs double)
  - Function length patterns
  - Any project-specific patterns that repeat across files

### 3. Generate `.claude/rules/code-map.md`
- List all major directories with purpose
- List key files with one-line descriptions
- Map entry points (API routes, main functions, page components)
- Document the data flow (request path from entry to database)

### 4. Generate `.claude/rules/coding-conventions.md`
- Document ONLY patterns observed in the actual code -- do not invent conventions
- Include copy-paste examples from real files (with file path references)
- Organize by category: naming, structure, error handling, imports, etc.
- If a pattern appears in 3+ files, it is a convention
- If two conflicting patterns exist, note both and ask which to standardize on

### 5. Generate `.claude/rules/file-paths.md`
- Map canonical locations for each file type
- Note any files that live in unexpected places
- Document URL-to-file mapping if applicable (routes, pages)

### 6. Update `.claude/rules/protected-files.md`
- Replace generic entries with actual protected files found:
  - Config files (env, build config, CI)
  - Migration/SQL files
  - Lock files
  - Generated/minified files
  - Files over 1000 lines (likely core, fragile)
  - Vendor/library directories

### 7. Update `.claude/memory/decisions.md` (or `tasks/decisions.md` if it exists)
- Replace generic template decisions with actual architectural decisions visible in the code:
  - Framework and runtime (from actual imports, not guessing)
  - Database (from connection strings, ORM usage)
  - Auth pattern (from middleware, session handling)
  - API style (from route definitions)

### 8. Report
- Output: "Scan complete. Generated:
  - .claude/rules/code-map.md ([N] directories, [N] key files)
  - .claude/rules/coding-conventions.md ([N] conventions observed)
  - .claude/rules/file-paths.md ([N] paths mapped)
  - .claude/rules/protected-files.md ([N] files protected)
  - decisions updated ([N] decisions seeded)"

## Notes

- This skill is READ-HEAVY -- it reads many files but only writes rule files
- Never invent conventions -- only document what the code actually does
- If the project is too small (< 5 source files), say so and skip convention extraction
- Re-run anytime with `/scan-codebase` to refresh after major refactors
