#!/usr/bin/env python3
"""
Claude Code Stop hook — warns if memory files have unsaved git changes.

Shows a reminder ONLY when changes are detected — silent otherwise.
Output: JSON with systemMessage (shown in Claude UI) or nothing at all.
Hook event: Stop (fires when Claude finishes responding)

No configuration needed — auto-detects memory directory.
"""

import json
import subprocess
import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent


def find_memory_dir():
    """Auto-detect the .claude/memory directory."""
    for path in ROOT.rglob('MEMORY.md'):
        if '.claude' in path.parts:
            return path.parent
    return ROOT / '.claude/memory'


def get_unsaved_changes(memory_dir):
    try:
        result = subprocess.run(
            ['git', '-C', str(memory_dir), 'status', '--porcelain'],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return ""


def auto_push(memory_dir):
    try:
        subprocess.run(['git', '-C', str(memory_dir), 'add', '-A'], timeout=10)
        subprocess.run(['git', '-C', str(memory_dir), 'commit',
                        '-m', f'Auto end session {datetime.datetime.now().strftime("%Y-%m-%d %H:%M")}'],
                       timeout=10)
        result = subprocess.run(['git', '-C', str(memory_dir), 'push'],
                                capture_output=True, text=True, timeout=30)
        return result.returncode == 0
    except Exception:
        return False


def main():
    memory_dir = find_memory_dir()
    if not memory_dir.exists():
        return

    changes = get_unsaved_changes(memory_dir)
    messages = []

    # Auto end session: past 9pm + unsaved changes → auto-push memory
    current_hour = datetime.datetime.now().hour
    if current_hour >= 21 and changes:
        success = auto_push(memory_dir)
        if success:
            messages.append("Auto end session: memory pushed. Run /learn to extract lessons.")
        else:
            messages.append("Auto end session: push failed. Run End Session manually.")
    elif changes:
        messages.append("Memory has unsaved changes. Type \"End Session\" to update and save.")

    if messages:
        print(json.dumps({'systemMessage': ' | '.join(messages)}))


if __name__ == '__main__':
    main()
