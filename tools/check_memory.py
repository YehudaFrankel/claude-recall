#!/usr/bin/env python3
"""
Claude Code memory drift checker.
Compares function names in JS files against js_functions.md,
and CSS class names against html_css_reference.md.

Usage:
  python tools/check_memory.py            # normal mode — always prints result
  python tools/check_memory.py --silent   # silent mode — prints only if drift found (used by hooks)

By default everything is AUTO-DETECTED — no configuration needed.
Override any setting below only if auto-detection picks the wrong files.
"""

import re
import sys
from pathlib import Path
from collections import Counter

SILENT = "--silent" in sys.argv

# ─── OPTIONAL OVERRIDES (leave empty for auto-detection) ─────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent  # project root

# Leave these empty to auto-detect. Add paths to override.
JS_FILES  = []
CSS_FILES = []

# Leave as None to auto-detect from your CSS files.
# Override example: r'\.(ttw-[\w-]+)'  or  r'\.(app-[\w-]+)'
CSS_CLASS_PATTERN = None

# Leave as None to auto-detect (searches for js_functions.md in project).
MEMORY_DIR = None

# ─────────────────────────────────────────────────────────────────────────────

EXCLUDE_DIRS = {
    'node_modules', 'vendor', 'dist', 'build', '.git',
    'bower_components', 'coverage', '__pycache__', 'tools',
    '.cache', 'out', 'tmp', 'temp',
}

MODIFIER_SUFFIXES = (
    '-active', '-open', '-disabled', '-locked', '-empty', '-success',
    '-error', '-loading', '-collapsed', '-dirty', '-sm', '-lg', '-xs',
    '-full', '-inline', '-new', '-replied', '-flush',
)

FUNC_PATTERNS = [
    re.compile(r'^function\s+(\w+)\s*\(', re.MULTILINE),
    re.compile(r'^async\s+function\s+(\w+)\s*\(', re.MULTILINE),
    re.compile(r'^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(', re.MULTILINE),
    re.compile(r'^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', re.MULTILINE),
    re.compile(r'^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\w+\s*=>', re.MULTILINE),
    re.compile(r'^\s{2,}(\w+)\s*\([^)]*\)\s*\{', re.MULTILINE),
    re.compile(r'^\s+(\w+)\s*:\s*(?:async\s+)?function', re.MULTILINE),
]

JS_KEYWORDS = {
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'return',
    'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new',
    'delete', 'typeof', 'instanceof', 'in', 'of', 'class', 'extends',
    'import', 'export', 'default', 'const', 'let', 'var', 'async',
    'await', 'yield', 'static', 'super', 'this', 'true', 'false', 'null',
    'undefined', 'void', 'debugger', 'with', 'function', 'setTimeout',
    'setInterval', 'clearTimeout', 'clearInterval', 'console', 'window',
    'document', 'module', 'require', 'Promise', 'Object', 'Array',
}


# ─── AUTO-DETECTION ───────────────────────────────────────────────────────────

def _is_excluded(path):
    return any(part in EXCLUDE_DIRS for part in path.parts)


def _is_minified(path):
    return '.min.' in path.name or path.name.endswith('-min.js') or path.name.endswith('-min.css')


def _is_too_large(path):
    try:
        return path.stat().st_size > 500_000
    except OSError:
        return True


def detect_js_files():
    files = []
    for path in sorted(ROOT.rglob('*.js')):
        if _is_excluded(path) or _is_minified(path) or _is_too_large(path):
            continue
        files.append(path)
    return files


def detect_css_files():
    files = []
    for path in sorted(ROOT.rglob('*.css')):
        if _is_excluded(path) or _is_minified(path) or _is_too_large(path):
            continue
        files.append(path)
    return files


def detect_memory_dir():
    # Look for js_functions.md anywhere in the tree
    for path in sorted(ROOT.rglob('js_functions.md')):
        return path.parent
    # Fall back to .claude/memory at project root
    return ROOT / '.claude/memory'


def detect_css_prefix(css_files):
    """Find the dominant CSS class prefix across all CSS files."""
    prefix_counts = Counter()
    class_pattern = re.compile(r'\.([\w][\w-]*)')

    for path in css_files:
        if not path.exists():
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        for m in class_pattern.finditer(text):
            cls = m.group(1)
            parts = cls.split('-')
            if len(parts) >= 2:
                prefix = parts[0] + '-'
                prefix_counts[prefix] += 1

    if not prefix_counts:
        return r'\.([\w-]+)'

    top_prefix, top_count = prefix_counts.most_common(1)[0]
    total = sum(prefix_counts.values())

    # Use prefix only if it dominates (>40% of all prefixed classes)
    if top_count / total >= 0.4 and top_count >= 5:
        escaped = re.escape(top_prefix)
        return rf'\.({escaped}[\w-]+)'

    # Multiple competing prefixes — track all
    return r'\.([\w-]+)'


# ─── EXTRACTION ───────────────────────────────────────────────────────────────

def extract_js_functions(paths):
    found = {}
    for path in paths:
        if not path.exists():
            if not SILENT:
                print(f"  WARN: JS file not found: {path}")
            continue
        if _is_too_large(path):
            if not SILENT:
                print(f"  WARN: Skipping {path.name} — file exceeds 500KB (likely bundled/minified)")
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        for pattern in FUNC_PATTERNS:
            for m in pattern.finditer(text):
                name = m.group(1)
                if name not in JS_KEYWORDS and name not in found:
                    found[name] = path.name
    return found


def extract_memory_functions(md_path):
    if not md_path.exists():
        return set()
    text = md_path.read_text(encoding='utf-8', errors='ignore')
    # Match backtick entries — single name or combined like `foo` / `bar`
    pattern = re.compile(r'`(\w+)(?:\([^)]*\))?`')
    names = set()
    for m in pattern.finditer(text):
        names.add(m.group(1))
    return names


def extract_css_classes(paths, css_pattern):
    found = set()
    pattern = re.compile(css_pattern)
    for path in paths:
        if not path.exists():
            if not SILENT:
                print(f"  WARN: CSS file not found: {path}")
            continue
        if _is_too_large(path):
            if not SILENT:
                print(f"  WARN: Skipping {path.name} — file exceeds 500KB")
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        for m in pattern.finditer(text):
            found.add(m.group(1))
    return found


def extract_memory_css_classes(md_path, css_pattern):
    if not md_path.exists():
        return set()
    text = md_path.read_text(encoding='utf-8', errors='ignore')
    pattern = re.compile(css_pattern)
    return set(m.group(1) for m in pattern.finditer(text))


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    # Resolve config — use overrides if set, otherwise auto-detect
    js_files   = JS_FILES  if JS_FILES  else detect_js_files()
    css_files  = CSS_FILES if CSS_FILES else detect_css_files()
    memory_dir = MEMORY_DIR if MEMORY_DIR else detect_memory_dir()
    css_pattern = CSS_CLASS_PATTERN if CSS_CLASS_PATTERN else detect_css_prefix(css_files)

    js_memory  = memory_dir / 'js_functions.md'
    css_memory = memory_dir / 'html_css_reference.md'

    if not js_files and not css_files:
        if not SILENT:
            print("No JS or CSS files found. Are you running from the project root?")
        sys.exit(0)

    if not SILENT:
        auto_js  = ' (auto)' if not JS_FILES  else ''
        auto_css = ' (auto)' if not CSS_FILES else ''
        print(f"Scanning: {len(js_files)} JS{auto_js}, {len(css_files)} CSS{auto_css} | memory: {memory_dir}")

    drift = False

    # --- JS function drift ---
    if js_files and js_memory.exists():
        code_fns  = extract_js_functions(js_files)
        mem_fns   = extract_memory_functions(js_memory)

        code_names = set(code_fns.keys())
        missing = code_names - mem_fns
        stale   = mem_fns - code_names

        if missing:
            drift = True
            print("DRIFT DETECTED \u2014 MISSING from js_functions.md (exist in code):")
            for fn in sorted(missing):
                print(f"  + {fn}  [{code_fns[fn]}]")

        if stale:
            drift = True
            print("DRIFT DETECTED \u2014 STALE in js_functions.md (no longer in code):")
            for fn in sorted(stale):
                print(f"  - {fn}")

    # --- CSS class drift ---
    if css_files and css_memory.exists():
        code_classes = extract_css_classes(css_files, css_pattern)
        mem_classes  = extract_memory_css_classes(css_memory, css_pattern)

        stale_css = mem_classes - code_classes
        if stale_css:
            drift = True
            print("DRIFT DETECTED \u2014 STALE in html_css_reference.md (no longer in CSS):")
            for cls in sorted(stale_css):
                print(f"  - .{cls}")

        missing_css = code_classes - mem_classes
        significant = {c for c in missing_css if not any(c.endswith(s) for s in MODIFIER_SUFFIXES)}
        if significant:
            drift = True
            print("DRIFT DETECTED \u2014 NEW CSS classes not yet in html_css_reference.md:")
            for cls in sorted(significant):
                print(f"  + .{cls}")

    # --- Plans drift check ---
    plans_dir = memory_dir / 'plans'
    if plans_dir.exists():
        memory_md = memory_dir / 'MEMORY.md'
        memory_text = memory_md.read_text(encoding='utf-8', errors='ignore') if memory_md.exists() else ''

        # Plan files: direct children only, skip _template.md and archive/
        plan_files = {p.stem for p in plans_dir.glob('*.md') if not p.name.startswith('_')}

        # References in MEMORY.md to plans/*.md (not plans/archive/)
        referenced_plans = set(re.findall(r'\bplans/(?!archive/)([^/)]+)\.md', memory_text))

        undocumented = plan_files - referenced_plans
        if undocumented:
            drift = True
            print("DRIFT DETECTED \u2014 Plan files not referenced in MEMORY.md:")
            for p in sorted(undocumented):
                print(f"  + plans/{p}.md")

        stale_refs = referenced_plans - plan_files
        if stale_refs:
            drift = True
            print("DRIFT DETECTED \u2014 MEMORY.md references missing plan files:")
            for p in sorted(stale_refs):
                print(f"  - plans/{p}.md (missing)")

    if not drift:
        if not SILENT:
            print("OK \u2014 no drift detected")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
