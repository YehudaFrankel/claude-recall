#!/usr/bin/env python3
"""
complexity_scan.py - Auto-scans project complexity and recommends skills.

Detects: languages, DB usage, test suite, API surface, framework.
Scores complexity: Low / Medium / High.
Outputs: .claude/memory/complexity_profile.md

Called automatically by Start Session if no profile exists (or profile is 30+ days old).
Rescan manually: delete complexity_profile.md and run Start Session,
  or run directly: python tools/complexity_scan.py
"""

import os
import re
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT       = SCRIPT_DIR.parent

SILENT = '--silent' in sys.argv

SKIP_DIRS = {
    'node_modules', '.git', '__pycache__', '.pytest_cache',
    'dist', 'build', 'out', 'target', '.gradle', '.mvn',
    'venv', '.venv', 'env', '.env', 'coverage', '.nyc_output',
    'files', 'uploads', 'backups', '.claude', '.playwright-mcp',
}

LANG_EXTENSIONS = {
    'Java':       ['.java'],
    'JavaScript': ['.js', '.mjs', '.cjs'],
    'TypeScript': ['.ts', '.tsx'],
    'Python':     ['.py'],
    'HTML':       ['.html', '.htm'],
    'CSS':        ['.css', '.scss', '.less'],
    'JSP':        ['.jsp', '.jspf'],
    'SQL':        ['.sql'],
    'Go':         ['.go'],
    'Ruby':       ['.rb'],
    'PHP':        ['.php'],
    'Rust':       ['.rs'],
    'C#':         ['.cs'],
}

# Skills recommended per detected signal
SKILL_MAP = {
    'Java':            ['java-reviewer', 'debug-resin', 'find-it'],
    'SQL':             ['write-query', 'add-db-column'],
    'db':              ['write-query', 'add-db-column'],
    'tests':           ['test-runner', 'verification-loop', 'smoke-test'],
    'api':             ['new-endpoint', 'search-first'],
    'JavaScript':      ['new-js-function', 'fix-bug'],
    'TypeScript':      ['new-js-function', 'fix-bug'],
    'Python':          ['fix-bug', 'code-review'],
    'high_complexity': ['plan', 'strategic-compact', 'learn'],
    'any':             ['fix-bug', 'code-review', 'learn', 'evolve'],
}

# Skills to surface as "can skip" if their signal is absent
OPTIONAL_SKILLS = {
    'java-reviewer': 'Java',
    'debug-resin':   'Java/Resin',
    'playwright':    'browser tests',
    'write-query':   'SQL/DB',
    'test-runner':   'test suite',
    'new-endpoint':  'API surface',
}

PROFILE_MAX_AGE_DAYS = 30


# ─── DETECTION ───────────────────────────────────────────────────────────────

def find_memory_dir():
    for path in ROOT.rglob('MEMORY.md'):
        if '.claude' in path.parts:
            return path.parent
    return ROOT / '.claude' / 'memory'


def scan_files():
    """Walk project, count source files per language."""
    lang_counts = {lang: 0 for lang in LANG_EXTENSIONS}
    ext_to_lang = {ext: lang for lang, exts in LANG_EXTENSIONS.items() for ext in exts}

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fname in filenames:
            lang = ext_to_lang.get(Path(fname).suffix.lower())
            if lang:
                lang_counts[lang] += 1

    detected = {lang: count for lang, count in lang_counts.items() if count > 0}
    source_count = sum(detected.values())
    return detected, source_count


def _walk_source(patterns):
    """Yield (path, text) for source files matching glob patterns, skipping SKIP_DIRS."""
    for pattern in patterns:
        for fpath in ROOT.rglob(pattern):
            if any(p in SKIP_DIRS for p in fpath.parts):
                continue
            try:
                yield fpath, fpath.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                pass


def detect_signals(detected_langs):
    """Detect DB, tests, API surface, and framework."""
    signals = {'db': False, 'tests': False, 'api': False, 'framework': None}

    # DB: SQL files present OR ORM imports
    if detected_langs.get('SQL', 0) > 0:
        signals['db'] = True
    if not signals['db']:
        orm_re = re.compile(
            r'(import sqlalchemy|from sqlalchemy|require.*sequelize|knex\(|mongoose\.|prisma\.|typeorm)',
            re.IGNORECASE
        )
        for _, text in _walk_source(['*.py', '*.js', '*.ts']):
            if orm_re.search(text):
                signals['db'] = True
                break

    # Tests: test directories or spec/test file naming patterns
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if Path(dirpath).name.lower() in ('tests', 'test', '__tests__', 'spec'):
            signals['tests'] = True
            break
        for fname in filenames:
            if re.search(r'(\.spec\.|\.test\.|_test\.|test_)', fname):
                signals['tests'] = True
                break
        if signals['tests']:
            break

    # API: common routing/endpoint patterns in source
    api_re = re.compile(
        r'(webservice|@app\.route|@router\.|app\.(get|post|put|delete)\s*\(|'
        r'express\(\)|@GetMapping|@PostMapping|@RestController|router\.route)',
        re.IGNORECASE
    )
    for _, text in _walk_source(['*.java', '*.py', '*.js', '*.ts']):
        if api_re.search(text):
            signals['api'] = True
            break

    # Framework: config files at project root
    if (ROOT / 'pom.xml').exists():
        signals['framework'] = 'Java/Maven'
    elif (ROOT / 'build.gradle').exists():
        signals['framework'] = 'Java/Gradle'
    elif (ROOT / 'package.json').exists():
        try:
            pkg  = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
            deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
            if 'react'   in deps: signals['framework'] = 'Node/React'
            elif 'vue'   in deps: signals['framework'] = 'Node/Vue'
            elif 'express' in deps: signals['framework'] = 'Node/Express'
            else:                 signals['framework'] = 'Node'
        except Exception:
            signals['framework'] = 'Node'
    elif (ROOT / 'requirements.txt').exists() or (ROOT / 'pyproject.toml').exists():
        signals['framework'] = 'Python'
    elif 'Java' in detected_langs:
        signals['framework'] = 'Java'

    return signals


# ─── SCORING ─────────────────────────────────────────────────────────────────

def score_complexity(detected_langs, source_count, signals):
    """Score complexity: Low / Medium / High."""
    # Markup languages don't count toward complexity
    code_langs = len([l for l in detected_langs if l not in ('HTML', 'CSS', 'Markdown')])

    if code_langs >= 3 or source_count >= 100 or (signals['db'] and signals['api'] and signals['tests']):
        return 'High'
    elif code_langs >= 2 or source_count >= 20 or signals['db'] or signals['tests']:
        return 'Medium'
    else:
        return 'Low'


# ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────

def build_recommendations(detected_langs, signals, complexity):
    seen  = set()
    recs  = []

    def add(skill, reason):
        if skill not in seen:
            seen.add(skill)
            recs.append((skill, reason))

    for skill in SKILL_MAP['any']:
        add(skill, 'recommended for any project')

    for lang in detected_langs:
        for skill in SKILL_MAP.get(lang, []):
            add(skill, f'{lang} detected')

    if signals['db']:
        for skill in SKILL_MAP['db']:
            add(skill, 'database detected')
    if signals['tests']:
        for skill in SKILL_MAP['tests']:
            add(skill, 'test suite detected')
    if signals['api']:
        for skill in SKILL_MAP['api']:
            add(skill, 'API surface detected')
    if complexity == 'High':
        for skill in SKILL_MAP['high_complexity']:
            add(skill, 'high complexity project')

    return recs


def build_skip_list(recommendations):
    rec_skills = {r[0] for r in recommendations}
    return [(skill, f'no {requires} detected')
            for skill, requires in OPTIONAL_SKILLS.items()
            if skill not in rec_skills]


# ─── OUTPUT ───────────────────────────────────────────────────────────────────

def write_profile(mem_dir, detected_langs, source_count, signals, complexity, recs, skip_list):
    now      = datetime.now().strftime('%Y-%m-%d')
    lang_str = ', '.join(sorted(detected_langs.keys()))

    sig_parts = [
        f'DB={"yes" if signals["db"] else "no"}',
        f'Tests={"yes" if signals["tests"] else "no"}',
        f'API={"yes" if signals["api"] else "no"}',
    ]
    if signals['framework']:
        sig_parts.append(f'Framework={signals["framework"]}')

    lines = [
        '# Complexity Profile',
        f'Generated: {now}',
        f'Stack: {lang_str}',
        f'Source files: {source_count}',
        f'Complexity: {complexity}',
        f'Signals: {", ".join(sig_parts)}',
        '',
        '## Recommended Skills',
    ]
    for skill, reason in recs:
        lines.append(f'- {skill} — {reason}')

    if skip_list:
        lines += ['', '## Skills you can skip']
        for skill, reason in skip_list:
            lines.append(f'- {skill} — {reason}')

    lines += [
        '',
        '---',
        'Rescan: delete this file and run Start Session, '
        'or run `python tools/complexity_scan.py` directly.',
    ]

    profile_path = mem_dir / 'complexity_profile.md'
    mem_dir.mkdir(parents=True, exist_ok=True)
    profile_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    return profile_path


def profile_is_fresh(mem_dir):
    """Return True if profile exists and is < PROFILE_MAX_AGE_DAYS old."""
    profile = mem_dir / 'complexity_profile.md'
    if not profile.exists():
        return False
    try:
        text  = profile.read_text(encoding='utf-8')
        match = re.search(r'^Generated:\s*(\d{4}-\d{2}-\d{2})', text, re.MULTILINE)
        if not match:
            return False
        generated = datetime.strptime(match.group(1), '%Y-%m-%d')
        return datetime.now() - generated < timedelta(days=PROFILE_MAX_AGE_DAYS)
    except Exception:
        return False


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    mem_dir = find_memory_dir()

    if not SILENT:
        print(f'Scanning: {ROOT}')

    detected_langs, source_count = scan_files()
    signals     = detect_signals(detected_langs)
    complexity  = score_complexity(detected_langs, source_count, signals)
    recs        = build_recommendations(detected_langs, signals, complexity)
    skip_list   = build_skip_list(recs)
    profile_path = write_profile(mem_dir, detected_langs, source_count, signals, complexity, recs, skip_list)

    code_langs = '+'.join(sorted(l for l in detected_langs if l not in ('HTML', 'CSS'))) or 'unknown'
    rec_count  = len(recs)

    # Always print the summary line — Start Session reads this
    print(f'Stack={code_langs} | Complexity={complexity} | {rec_count} skills recommended')

    if not SILENT:
        print(f'Profile: {profile_path}')

    return code_langs, complexity, rec_count


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        if not SILENT:
            print(f'Scan failed: {e}')
