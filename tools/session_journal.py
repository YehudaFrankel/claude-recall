#!/usr/bin/env python3
"""
session_journal.py - Auto-captures a rich session summary on every Stop.
No /learn needed. No manual action required.

Reads draft-lessons.md (auto-tracked edits) + STATUS.md current phase,
writes a searchable entry to session_journal.md.

Search the journal: Grep(pattern='keyword', path=session_journal.md)
Hook event: Stop
"""

import re
import os
import glob as glob_module
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent


def find_memory_dir():
    """Auto-detect the .claude/memory directory."""
    for path in ROOT.rglob('MEMORY.md'):
        if '.claude' in path.parts:
            return path.parent
    return ROOT / '.claude' / 'memory'


def read_edited_files(draft_path: Path) -> list:
    """Extract unique filenames from draft-lessons.md."""
    if not draft_path.exists():
        return []
    seen = []
    for line in draft_path.read_text(encoding='utf-8').splitlines():
        m = re.search(r'Edited: (.+)$', line)
        if m:
            f = m.group(1).strip()
            if f not in seen:
                seen.append(f)
    return seen


def read_current_phase(status_path: Path) -> str:
    """Read the current phase summary from STATUS.md."""
    if not status_path.exists():
        return ''
    lines = status_path.read_text(encoding='utf-8').splitlines()
    capture_next = False
    for line in lines:
        if capture_next and line.strip():
            phase = re.sub(r'^>\s*', '', line)
            phase = re.sub(r'^\*\*[^*]+\*\*\s*', '', phase)
            return phase[:120]
        if '## Current Phase' in line:
            capture_next = True
    return ''


def estimate_tokens(root: Path) -> tuple:
    """Estimate token usage from session jsonl file size. Returns (tokens, pct, warning)."""
    try:
        project_dir = root / '.claude' / 'projects'
        if not project_dir.exists():
            # Try common Claude project dirs
            home = Path.home()
            project_dir = home / '.claude' / 'projects'
        jsonl_files = list(project_dir.rglob('*.jsonl'))
        if not jsonl_files:
            return 0, 0, ''
        latest = max(jsonl_files, key=lambda f: f.stat().st_mtime)
        tokens = round(latest.stat().st_size / 4)
        pct = round(tokens / 200000 * 100)
        warn = ''
        if pct >= 80:
            warn = f' [!!! {pct}% context - compact soon]'
        elif pct >= 60:
            warn = f' [{pct}% context used]'
        return tokens, pct, warn
    except Exception:
        return 0, 0, ''


def read_edit_count(mem_dir: Path) -> int:
    """Read session edit counter."""
    counter_file = mem_dir / 'tasks' / 'session_edit_count.txt'
    if counter_file.exists():
        try:
            return int(counter_file.read_text(encoding='utf-8').strip())
        except Exception:
            pass
    return 0


def read_open_plans(mem_dir: Path) -> list:
    """Scan plans/ (not archive/) for any Draft or On Hold plans."""
    plans_dir = mem_dir / 'plans'
    if not plans_dir.exists():
        return []
    open_plans = []
    for plan_file in sorted(plans_dir.glob('*.md')):
        if plan_file.name.startswith('_'):
            continue
        try:
            text = plan_file.read_text(encoding='utf-8')
            m = re.search(r'\*\*Status:\*\*\s*(.+)', text)
            if not m:
                continue
            status = m.group(1).strip()
            if status in ('Draft', 'On Hold'):
                name = plan_file.stem.replace('-', ' ').title()
                open_plans.append(f'{name} ({status})')
        except Exception:
            pass
    return open_plans


def main():
    mem_dir = find_memory_dir()
    draft_file   = mem_dir / 'tasks' / 'draft-lessons.md'
    status_file  = mem_dir / 'STATUS.md'
    journal_file = mem_dir / 'session_journal.md'

    edited_files = read_edited_files(draft_file)
    phase        = read_current_phase(status_file)
    edit_count   = read_edit_count(mem_dir)
    open_plans   = read_open_plans(mem_dir)
    tokens, pct, warn = estimate_tokens(ROOT)

    # Skip if nothing happened
    if not edited_files and not phase:
        return

    now       = datetime.now().strftime('%Y-%m-%d %H:%M')
    files_str = ', '.join(edited_files) if edited_files else 'no files edited'
    edit_str  = f'{edit_count} file saves' if edit_count > 0 else '0 file saves'
    token_str = f'~{tokens:,} tokens ({pct}%){warn}' if tokens > 0 else 'unknown'

    plans_str = ', '.join(open_plans) if open_plans else ''
    entry = (
        f'\n## [{now}]\n'
        f'**Files:** {files_str}\n'
        f'**Edits:** {edit_str} | **Tokens:** {token_str}\n'
        f'**What:** {phase}\n'
    )
    if plans_str:
        entry += f'**Open plans:** {plans_str}\n'

    # Create journal with header if missing
    if not journal_file.exists():
        journal_file.write_text(
            '# Session Journal\n'
            'Auto-captured every session. '
            'Search: Grep(pattern=\'keyword\', path=session_journal.md)\n',
            encoding='utf-8'
        )

    with open(journal_file, 'a', encoding='utf-8') as f:
        f.write(entry)

    # Clear draft-lessons for next session
    if draft_file.exists():
        draft_file.write_text(
            '# Draft Lessons (auto-tracked edits)\n'
            '_Run /learn to extract patterns from these._\n',
            encoding='utf-8'
        )


if __name__ == '__main__':
    try:
        main()
    except Exception:
        pass  # Never block the session on a hook error
