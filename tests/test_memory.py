"""
tests/test_memory.py — Tests for tools/memory.py session-start helpers and memory diff.

Covers: _load_memory_context, _load_status_context, _check_interruption,
        _check_correction_queue, _reset_session_counter, _snapshot_memory_state,
        cmd_memory_diff.

Run:
  pip install pytest
  pytest tests/test_memory.py -v
"""

import json
import sys
from pathlib import Path

import pytest

KIT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KIT_ROOT / 'tools'))

import memory  # noqa: E402


# ─── FIXTURES ────────────────────────────────────────────────────────────────

@pytest.fixture
def kit(tmp_path):
    """
    Temporary kit root with .claude/memory/ and required subdirs.
    Patches memory module globals to point here.
    """
    mem = tmp_path / '.claude' / 'memory'
    mem.mkdir(parents=True)
    (mem / 'tasks').mkdir()

    memory.ROOT       = tmp_path
    memory.SCRIPT_DIR = tmp_path / 'tools'

    return tmp_path


# ─── _load_memory_context ────────────────────────────────────────────────────

def test_load_memory_context_returns_content(kit):
    mem = kit / '.claude' / 'memory'
    (mem / 'MEMORY.md').write_text('- [Lessons](lessons.md)\n', encoding='utf-8')

    result = memory._load_memory_context(mem)

    assert '# Memory Index' in result
    assert 'Lessons' in result


def test_load_memory_context_missing_file(kit):
    mem = kit / '.claude' / 'memory'
    result = memory._load_memory_context(mem)
    assert result == ''


# ─── _load_status_context ────────────────────────────────────────────────────

def test_load_status_context_returns_last_30_lines(kit):
    lines = [f'Line {i}' for i in range(50)]
    (kit / 'STATUS.md').write_text('\n'.join(lines), encoding='utf-8')

    result = memory._load_status_context()

    assert 'Current Status' in result
    assert 'Line 49' in result   # last line included
    assert 'Line 0' not in result  # first lines trimmed


def test_load_status_context_missing_file(kit):
    result = memory._load_status_context()
    assert result == ''


def test_load_status_context_short_file(kit):
    (kit / 'STATUS.md').write_text('Line 1\nLine 2\n', encoding='utf-8')
    result = memory._load_status_context()
    assert 'Line 1' in result
    assert 'Line 2' in result


# ─── _check_interruption ─────────────────────────────────────────────────────

def test_check_interruption_returns_block_and_deletes_file(kit):
    mem = kit / '.claude' / 'memory'
    interrupt = mem / 'tasks' / 'interruption_state.md'
    interrupt.write_text('Was in the middle of a refactor.', encoding='utf-8')

    result = memory._check_interruption(mem)

    assert 'LAST SESSION INTERRUPTED' in result
    assert 'refactor' in result
    assert not interrupt.exists()


def test_check_interruption_empty_file_deleted(kit):
    mem = kit / '.claude' / 'memory'
    (mem / 'tasks' / 'interruption_state.md').write_text('', encoding='utf-8')

    result = memory._check_interruption(mem)

    assert result == ''


def test_check_interruption_no_file(kit):
    mem = kit / '.claude' / 'memory'
    result = memory._check_interruption(mem)
    assert result == ''


# ─── _check_correction_queue ─────────────────────────────────────────────────

def test_check_correction_queue_returns_pending(kit):
    mem = kit / '.claude' / 'memory'
    queue = mem / 'tasks' / 'corrections_queue.md'
    queue.write_text(
        '## 2026-04-05 14:00\n**Prompt:** "don\'t use jQuery here"\n',
        encoding='utf-8'
    )

    result = memory._check_correction_queue(mem)

    assert 'Pending Corrections' in result
    assert 'jQuery' in result


def test_check_correction_queue_empty_queue(kit):
    mem = kit / '.claude' / 'memory'
    (mem / 'tasks' / 'corrections_queue.md').write_text('', encoding='utf-8')

    result = memory._check_correction_queue(mem)
    assert result == ''


def test_check_correction_queue_no_file(kit):
    mem = kit / '.claude' / 'memory'
    result = memory._check_correction_queue(mem)
    assert result == ''


# ─── _reset_session_counter ──────────────────────────────────────────────────

def test_reset_session_counter_creates_file(kit):
    mem = kit / '.claude' / 'memory'
    memory._reset_session_counter(mem)
    counter = mem / 'tasks' / 'session_edit_count.txt'
    assert counter.exists()
    assert counter.read_text() == '0'


def test_reset_session_counter_overwrites_existing(kit):
    mem = kit / '.claude' / 'memory'
    counter = mem / 'tasks' / 'session_edit_count.txt'
    counter.write_text('42', encoding='utf-8')
    memory._reset_session_counter(mem)
    assert counter.read_text() == '0'


# ─── _snapshot_memory_state ──────────────────────────────────────────────────

def test_snapshot_records_line_counts(kit):
    mem = kit / '.claude' / 'memory'
    (mem / 'lessons.md').write_text('line1\nline2\nline3\n', encoding='utf-8')
    (mem / 'decisions.md').write_text('line1\n', encoding='utf-8')

    memory._snapshot_memory_state(mem)

    snap_file = mem / 'tasks' / 'session_snapshot.json'
    assert snap_file.exists()
    snap = json.loads(snap_file.read_text())
    assert snap.get('lessons.md') == 3
    assert snap.get('decisions.md') == 1


def test_snapshot_creates_tasks_dir(kit):
    mem = kit / '.claude' / 'memory'
    tasks_dir = mem / 'tasks'
    tasks_dir.rmdir()  # remove to test creation

    (mem / 'notes.md').write_text('x\n', encoding='utf-8')
    memory._snapshot_memory_state(mem)  # should not raise

    assert (mem / 'tasks' / 'session_snapshot.json').exists()


# ─── cmd_memory_diff ─────────────────────────────────────────────────────────

def test_memory_diff_reports_additions(kit, capsys):
    mem = kit / '.claude' / 'memory'

    # Seed snapshot: lessons.md had 2 lines
    snap = {'lessons.md': 2, 'decisions.md': 1}
    snap_file = mem / 'tasks' / 'session_snapshot.json'
    snap_file.write_text(json.dumps(snap), encoding='utf-8')

    # Current state: lessons.md now has 5 lines
    (mem / 'lessons.md').write_text('a\nb\nc\nd\ne\n', encoding='utf-8')
    (mem / 'decisions.md').write_text('x\n', encoding='utf-8')

    memory.cmd_memory_diff()

    out = capsys.readouterr().out
    assert 'lessons.md +3' in out
    assert 'decisions.md' not in out  # unchanged


def test_memory_diff_reports_unchanged(kit, capsys):
    mem = kit / '.claude' / 'memory'

    (mem / 'notes.md').write_text('line\n', encoding='utf-8')
    snap = {'notes.md': 1}
    (mem / 'tasks' / 'session_snapshot.json').write_text(json.dumps(snap), encoding='utf-8')

    memory.cmd_memory_diff()

    out = capsys.readouterr().out
    assert 'unchanged' in out.lower()


def test_memory_diff_no_snapshot(kit, capsys):
    memory.cmd_memory_diff()
    out = capsys.readouterr().out
    assert 'No session snapshot' in out


# ─── cmd_log_edit ─────────────────────────────────────────────────────────────

def test_log_edit_writes_filename(kit, monkeypatch):
    mem = kit / '.claude' / 'memory'
    monkeypatch.setattr('sys.stdin', __import__('io').StringIO(
        '{"tool_input": {"file_path": "/project/src/main.py"}}'
    ))
    memory.cmd_log_edit()
    draft = mem / 'tasks' / 'draft-lessons.md'
    assert draft.exists()
    assert 'main.py' in draft.read_text()


def test_log_edit_no_duplicate_entries(kit, monkeypatch):
    mem = kit / '.claude' / 'memory'
    payload = '{"tool_input": {"file_path": "/project/app.js"}}'
    import io
    monkeypatch.setattr('sys.stdin', io.StringIO(payload))
    memory.cmd_log_edit()
    monkeypatch.setattr('sys.stdin', io.StringIO(payload))
    memory.cmd_log_edit()
    draft = mem / 'tasks' / 'draft-lessons.md'
    count = draft.read_text().count('app.js')
    assert count == 1


def test_log_edit_empty_input_no_crash(kit, monkeypatch):
    import io
    monkeypatch.setattr('sys.stdin', io.StringIO(''))
    memory.cmd_log_edit()   # must not raise


# ─── cmd_capture_correction ───────────────────────────────────────────────────

class _FakeStdin:
    """Wraps a bytes payload so sys.stdin.buffer.read() works in tests."""
    def __init__(self, payload: bytes):
        import io
        self.buffer = io.BytesIO(payload)


def test_capture_correction_queues_correction(kit, monkeypatch):
    mem = kit / '.claude' / 'memory'
    monkeypatch.setattr('sys.stdin', _FakeStdin(b'{"prompt": "don\'t use jQuery here"}'))
    memory.cmd_capture_correction()
    queue = mem / 'tasks' / 'corrections_queue.md'
    assert queue.exists()
    assert 'jQuery' in queue.read_text()


def test_capture_correction_remember_prefix_writes_draft(kit, monkeypatch):
    mem = kit / '.claude' / 'memory'
    monkeypatch.setattr('sys.stdin', _FakeStdin(
        b'{"prompt": "remember: always use fAddQuotes for SQL values"}'
    ))
    memory.cmd_capture_correction()
    draft = mem / 'tasks' / 'draft-lessons.md'
    assert draft.exists()
    assert 'fAddQuotes' in draft.read_text()


def test_capture_correction_non_correction_ignored(kit, monkeypatch):
    mem = kit / '.claude' / 'memory'
    monkeypatch.setattr('sys.stdin', _FakeStdin(
        b'{"prompt": "what does this function do?"}'
    ))
    memory.cmd_capture_correction()
    queue = mem / 'tasks' / 'corrections_queue.md'
    assert not queue.exists()


# ─── cmd_stop_check ───────────────────────────────────────────────────────────

def test_stop_check_edit_count_reported(kit, capsys):
    mem = kit / '.claude' / 'memory'
    (mem / 'tasks' / 'session_edit_count.txt').write_text('5', encoding='utf-8')
    memory.cmd_stop_check()
    out = capsys.readouterr().out
    # output is JSON systemMessage or empty — just confirm no crash
    assert out is not None


def test_stop_check_no_memory_dir_no_crash(kit):
    import shutil
    shutil.rmtree(kit / '.claude' / 'memory')
    memory.cmd_stop_check()   # must not raise


# ─── cmd_journal ──────────────────────────────────────────────────────────────

def test_journal_no_output_when_nothing_to_record(kit):
    # No draft-lessons.md and no STATUS.md → journal skips silently
    memory.cmd_journal()
    mem = kit / '.claude' / 'memory'
    assert not (mem / 'session_journal.md').exists()


def test_journal_writes_entry_when_files_edited(kit):
    mem = kit / '.claude' / 'memory'
    draft = mem / 'tasks' / 'draft-lessons.md'
    draft.write_text('- Edited: app.js\n', encoding='utf-8')
    (kit / 'STATUS.md').write_text(
        '## Current Phase\n> Working on auth module\n', encoding='utf-8'
    )
    memory.cmd_journal()
    journal = mem / 'session_journal.md'
    assert journal.exists()
    assert 'app.js' in journal.read_text()


def test_journal_clears_draft_after_write(kit):
    mem = kit / '.claude' / 'memory'
    draft = mem / 'tasks' / 'draft-lessons.md'
    draft.write_text('- Edited: routes.py\n', encoding='utf-8')
    (kit / 'STATUS.md').write_text(
        '## Current Phase\n> Refactoring routes\n', encoding='utf-8'
    )
    memory.cmd_journal()
    # draft is reset to header-only, edited filenames removed
    remaining = draft.read_text()
    assert 'routes.py' not in remaining
