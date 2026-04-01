---
description: Named grep-based guards against known bug patterns — SQL injection, hardcoded URLs, null access, secrets
globs:
  - "**/*.js"
  - "**/*.ts"
  - "**/*.jsx"
  - "**/*.tsx"
  - "**/*.java"
  - "**/*.py"
  - "**/*.go"
  - "**/*.rb"
alwaysApply: false
---

# Guard Patterns — Named Checks That Prevent Known Mistakes

Each entry: ID, what to check, how to grep for it, which files, and why it matters.
Run `Guard Check` to scan all guards automatically.
Add a guard when you catch the same mistake twice.

---

## NULL_BEFORE_ACCESS
- **Check**: Never access a property on a value that could be null/undefined without a null guard
- **How to scan**: Grep for `\.map\(` or `\.forEach\(` on variables that come from API calls — verify there is a null check before the call
- **Files**: All JS/TS component and utility files
- **Why**: API calls can return null; unguarded property access throws and crashes the entire render tree

## HARDCODED_URL
- **Check**: No hardcoded localhost URLs or environment-specific strings in source files
- **How to scan**: Grep for `localhost:` in non-test source files
- **Files**: All JS, config files — exclude test files and .env files
- **Why**: Hardcoded dev URLs ship to production silently; symptoms are 404s that only appear in prod

## RAW_ERROR_EXPOSURE
- **Check**: Never return raw exception messages directly to the frontend response
- **How to scan**: Grep for `catch` blocks that pass `e.message` or `error.message` directly into a response object
- **Files**: All backend route, controller, and handler files
- **Why**: Stack traces and internal paths are exposed via raw exception messages — security surface and information leak

## CONSOLE_LOG_LEFT_IN
- **Check**: No `console.log` statements in production code paths
- **How to scan**: Grep for `console\.log\(` in source files, excluding test files
- **Files**: All JS/TS source files — exclude *.test.*, *.spec.*
- **Why**: console.log left in production floods browser consoles, leaks internal state, and is unprofessional

---

## SQL_CONCAT_INJECTION
- **Check**: SQL queries must never be built by direct string concatenation with user-supplied values
- **How to scan**: Grep for `"SELECT\|INSERT\|UPDATE\|DELETE` followed by `+` on the same line in backend files
- **Files**: All backend files (*.java, *.js, *.py, *.ts)
- **Why**: Raw string concatenation into SQL = SQL injection. Always use parameterized queries or a quoting helper.

## MISSING_AUTH_CHECK
- **Check**: Every endpoint that writes data or returns user-specific data must verify the caller's identity before executing
- **How to scan**: Grep for route/endpoint definitions; for each one, confirm an auth/session check appears before any DB write
- **Files**: All route, controller, and handler files
- **Why**: Missing auth on a write endpoint = any caller can modify any user's data. Easy to miss when adding endpoints quickly.

## SECRET_IN_SOURCE
- **Check**: No hardcoded passwords, API keys, tokens, or secrets in source files
- **How to scan**: Grep for `password\s*=\s*["']|api_key\s*=\s*["']|secret\s*=\s*["']|token\s*=\s*["']` (case-insensitive) in source files
- **Files**: All source files — exclude .env, *.example, test fixtures
- **Why**: Secrets in source get committed to git and are exposed permanently in history even after removal.

---

*Name guards clearly — the ID is what gets referenced when a violation is found.*
*Grep patterns use backtick-wrapped regex: the Guard Check command extracts and runs them automatically.*
