#!/usr/bin/env python3
"""
team_sync.py — Clankbrain Team Sync (optional add-on)

Shares memory files across a team via a private git repo.
Personal memory stays local. Team memory is shared.

  PERSONAL (local only)       TEAM (shared)
  velocity.md                 decisions.md
  skill_scores.md             lessons.md
  user_preferences.md         regret.md
  session_journal.md          error-lookup.md
  todo.md                     critical-notes.md
                              agreed-flow.md
                              guard-patterns.md
                              complexity_profile.md (if present)

Merge strategy: set-union by first column — append-only, no git conflicts.

Usage:
  python tools/team_sync.py setup-team https://github.com/team/shared-memory
  python tools/team_sync.py join https://github.com/team/shared-memory
  python tools/team_sync.py pull-team
  python tools/team_sync.py push-team
  python tools/team_sync.py team-status
"""

import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent

TEAM_CONFIG_PATH = ROOT / '.claude' / 'team_config.json'
TEAM_REPO_DIR    = ROOT / '.claude' / 'team_repo'

# Files in memory/ that are shared with the team
TEAM_MEMORY_FILES = [
    'decisions.md',
    'lessons.md',
    'regret.md',
    'error-lookup.md',
    'critical-notes.md',
    'agreed-flow.md',
]

# Some files live in a subdirectory locally but are stored flat in the team repo
TEAM_FILES_LOCAL_OVERRIDE = {
    'regret.md': 'tasks/regret.md',
}

# Table header values to skip during merge (not data rows)
_HEADER_KEYS = {
    'error message', 'symptom', 'issue', 'error', 'approach',
    'what was tried', 'rejected approach', 'decision', 'what was decided',
    'date', 'session', 'title', 'flow', 'note', 'gotcha', 'notes',
}


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def find_memory_dir():
    for path in ROOT.rglob('MEMORY.md'):
        if '.claude' in path.parts:
            return path.parent
    return ROOT / '.claude' / 'memory'


def load_config():
    if not TEAM_CONFIG_PATH.exists():
        return {}
    try:
        return json.loads(TEAM_CONFIG_PATH.read_text(encoding='utf-8'))
    except Exception:
        return {}


def save_config(cfg):
    TEAM_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    TEAM_CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding='utf-8')


def git(args, cwd):
    """Run a git command. Returns (returncode, stdout, stderr)."""
    try:
        r = subprocess.run(
            ['git'] + args, cwd=str(cwd),
            capture_output=True, text=True
        )
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except FileNotFoundError:
        return 1, '', 'git not found — install git and ensure it is in PATH'


def _parse_rows(text):
    """Parse markdown table rows. Returns list of cell-lists."""
    rows = []
    for line in text.splitlines():
        s = line.strip()
        if not s.startswith('|'):
            continue
        cells = [c.strip() for c in s.split('|') if c.strip()]
        if not cells:
            continue
        if all(set(c) <= set('-: ') for c in cells):
            continue  # separator row
        rows.append(cells)
    return rows


# ─── MERGE LOGIC ──────────────────────────────────────────────────────────────

def merge_table(local_path, remote_path):
    """
    Append rows from remote that are not already in local (keyed by first column).
    Returns count of new rows added.
    """
    if not remote_path.exists():
        return 0

    local_text  = local_path.read_text(encoding='utf-8', errors='ignore') if local_path.exists() else ''
    remote_text = remote_path.read_text(encoding='utf-8', errors='ignore')

    local_rows  = _parse_rows(local_text)
    remote_rows = _parse_rows(remote_text)

    local_keys = {r[0].lower() for r in local_rows if r}
    local_keys -= _HEADER_KEYS

    new_rows = []
    for row in remote_rows:
        if not row:
            continue
        key = row[0].lower()
        if key in _HEADER_KEYS:
            continue
        if key not in local_keys:
            new_rows.append(row)
            local_keys.add(key)

    if not new_rows:
        return 0

    lines = ['| ' + ' | '.join(row) + ' |' for row in new_rows]
    with open(local_path, 'a', encoding='utf-8') as f:
        f.write('\n' + '\n'.join(lines) + '\n')

    return len(new_rows)


def merge_guard_patterns(local_path, remote_path):
    """
    Append guard sections (## GUARD_ID blocks) from remote that are not in local.
    Returns count of new guards added.
    """
    if not remote_path.exists():
        return 0

    local_text  = local_path.read_text(encoding='utf-8', errors='ignore') if local_path.exists() else ''
    remote_text = remote_path.read_text(encoding='utf-8', errors='ignore')

    local_ids = set(re.findall(r'^## ([A-Z_0-9]+)', local_text, re.MULTILINE))

    # Split remote into sections by guard ID header
    sections = re.split(r'\n(?=## [A-Z_0-9]+)', remote_text)
    new_sections = []
    for section in sections:
        m = re.match(r'## ([A-Z_0-9]+)', section.strip())
        if m and m.group(1) not in local_ids:
            new_sections.append(section.strip())
            local_ids.add(m.group(1))

    if not new_sections:
        return 0

    with open(local_path, 'a', encoding='utf-8') as f:
        f.write('\n\n' + '\n\n'.join(new_sections) + '\n')

    return len(new_sections)


# ─── COPY TEAM FILES TO REPO DIR ─────────────────────────────────────────────

def _copy_to_repo():
    """Copy current team files into the team_repo checkout. Returns count copied."""
    mem_dir = find_memory_dir()
    copied = 0

    for fname in TEAM_MEMORY_FILES:
        local_name = TEAM_FILES_LOCAL_OVERRIDE.get(fname, fname)
        src = mem_dir / local_name
        if src.exists():
            shutil.copy2(src, TEAM_REPO_DIR / fname)
            copied += 1

    # guard-patterns.md lives in .claude/rules/
    gp = ROOT / '.claude' / 'rules' / 'guard-patterns.md'
    if gp.exists():
        shutil.copy2(gp, TEAM_REPO_DIR / 'guard-patterns.md')
        copied += 1

    # complexity_profile.md — copy to team if it exists locally
    cp = mem_dir / 'complexity_profile.md'
    if cp.exists():
        shutil.copy2(cp, TEAM_REPO_DIR / 'complexity_profile.md')
        copied += 1

    return copied


# ─── COMMANDS ─────────────────────────────────────────────────────────────────

def _check_git_auth(repo_url):
    """
    Best-effort check that git can reach the remote.
    Returns (ok: bool, hint: str).
    """
    rc, out, err = git(['ls-remote', '--exit-code', repo_url], cwd=ROOT)
    if rc == 0:
        return True, ''

    combined = (out + err).lower()
    if 'authentication' in combined or 'permission' in combined or '403' in combined:
        hint = (
            'Git auth failed. Fix with one of:\n'
            '  gh auth login                        # GitHub CLI (recommended)\n'
            '  git config --global credential.helper manager  # Windows Credential Manager\n'
            'Then re-run Setup Team.'
        )
    elif 'not found' in combined or '404' in combined:
        hint = (
            f'Repo not found: {repo_url}\n'
            'Check the URL and make sure the repo exists (create it at github.com/new — set to Private).\n'
            'Then re-run Setup Team.'
        )
    elif 'could not resolve' in combined or 'unable to connect' in combined:
        hint = 'No network access — check your internet connection and try again.'
    else:
        hint = f'git ls-remote failed:\n  {err or out}\nCheck the repo URL and git auth, then retry.'

    return False, hint


def cmd_setup_team(repo_url):
    print(f'Setting up team sync → {repo_url}')

    # Check git auth before doing anything
    print('Checking git access...')
    ok, hint = _check_git_auth(repo_url)
    if not ok:
        print(f'\n{hint}')
        return

    if TEAM_REPO_DIR.exists() and (TEAM_REPO_DIR / '.git').exists():
        print('Team repo already initialised at .claude/team_repo/')
        print('Run "Team Pull" to sync latest, or "Team Status" to check.')
        return

    TEAM_REPO_DIR.mkdir(parents=True, exist_ok=True)

    # Try cloning first (repo may already have content from a teammate)
    print('Cloning team repo...')
    rc, out, err = git(['clone', repo_url, '.'], cwd=TEAM_REPO_DIR)

    if rc != 0:
        # Empty repo or clone failed — init fresh
        git(['init'], cwd=TEAM_REPO_DIR)
        rc2, _, _ = git(['remote', 'add', 'origin', repo_url], cwd=TEAM_REPO_DIR)
        if rc2 != 0:
            git(['remote', 'set-url', 'origin', repo_url], cwd=TEAM_REPO_DIR)
        print('Initialised new team repo.')

    # Copy current files and do initial push
    print('Pushing initial team files...')
    _copy_to_repo()

    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    git(['add', '-A'], cwd=TEAM_REPO_DIR)
    rc, out, err = git(['commit', '-m', f'team sync init {now}'], cwd=TEAM_REPO_DIR)

    if rc == 0 or 'nothing to commit' not in (out + err).lower():
        for branch in ('main', 'master'):
            rc2, _, _ = git(['push', '--set-upstream', 'origin', branch], cwd=TEAM_REPO_DIR)
            if rc2 == 0:
                break

    cfg = load_config()
    cfg['repo']       = repo_url
    cfg['setup_date'] = datetime.now().strftime('%Y-%m-%d')
    cfg['last_push']  = datetime.now().strftime('%Y-%m-%d %H:%M')
    save_config(cfg)

    print(f'\nTeam sync enabled.')
    print(f'Repo:  {repo_url}')
    print(f'Files: {", ".join(TEAM_MEMORY_FILES + ["guard-patterns.md"])}')
    print('\nShare this URL with your team:')
    print(f'  python tools/team_sync.py join {repo_url}')
    print('\nWorkflow:')
    print('  Start Session → team memory pulls automatically')
    print('  End Session   → "Team Push"   (share what you found)')


def cmd_pull_team():
    cfg = load_config()
    if not cfg.get('repo'):
        print('Team sync not configured.')
        print('Run: python tools/team_sync.py setup-team https://github.com/team/shared-memory')
        return

    if not TEAM_REPO_DIR.exists() or not (TEAM_REPO_DIR / '.git').exists():
        print('Team repo missing — re-run Setup Team.')
        return

    print('Pulling team memory...')
    for branch in ('main', 'master'):
        rc, out, err = git(['pull', 'origin', branch], cwd=TEAM_REPO_DIR)
        if rc == 0 or 'already up to date' in (out + err).lower():
            break

    mem_dir   = find_memory_dir()
    total     = 0
    additions = []

    for fname in TEAM_MEMORY_FILES:
        remote     = TEAM_REPO_DIR / fname
        local_name = TEAM_FILES_LOCAL_OVERRIDE.get(fname, fname)
        local      = mem_dir / local_name
        n = merge_table(local, remote)
        if n:
            additions.append(f'  {fname}: +{n} new entr{"y" if n == 1 else "ies"} from team')
            total += n

    remote_gp = TEAM_REPO_DIR / 'guard-patterns.md'
    local_gp  = ROOT / '.claude' / 'rules' / 'guard-patterns.md'
    n = merge_guard_patterns(local_gp, remote_gp)
    if n:
        additions.append(f'  guard-patterns.md: +{n} new guard{"" if n == 1 else "s"} from team')
        total += n

    # complexity_profile.md — copy from team if missing locally
    remote_cp = TEAM_REPO_DIR / 'complexity_profile.md'
    local_cp  = mem_dir / 'complexity_profile.md'
    if remote_cp.exists() and not local_cp.exists():
        shutil.copy2(remote_cp, local_cp)
        additions.append('  complexity_profile.md: copied from team')
        total += 1

    cfg['last_pull'] = datetime.now().strftime('%Y-%m-%d %H:%M')
    save_config(cfg)

    if additions:
        print('\n'.join(additions))
        print(f'\n{total} new entries merged from team.')
    else:
        print('Already up to date — no new entries from team.')


def cmd_join_team(repo_url):
    cfg = load_config()
    if cfg.get('repo'):
        print(f'Already on a team: {cfg["repo"]}')
        print('Run "Team Status" to check, or delete .claude/team_config.json to reset.')
        return

    if TEAM_REPO_DIR.exists() and (TEAM_REPO_DIR / '.git').exists():
        print('Team repo already exists locally. Run "Team Pull" to sync.')
        return

    print(f'Joining team memory at {repo_url}...')

    # Check git auth before doing anything
    print('Checking git access...')
    ok, hint = _check_git_auth(repo_url)
    if not ok:
        print(f'\n{hint}')
        return

    TEAM_REPO_DIR.mkdir(parents=True, exist_ok=True)
    rc, out, err = git(['clone', repo_url, '.'], cwd=TEAM_REPO_DIR)
    if rc != 0:
        print(f'Clone failed: {err or out}')
        shutil.rmtree(TEAM_REPO_DIR, ignore_errors=True)
        return

    # Show what's in the team repo before touching anything
    mem_dir   = find_memory_dir()
    available = []
    for fname in TEAM_MEMORY_FILES + ['guard-patterns.md', 'complexity_profile.md']:
        remote = TEAM_REPO_DIR / fname
        if remote.exists():
            lines = len(remote.read_text(encoding='utf-8', errors='ignore').splitlines())
            available.append((fname, lines))

    if not available:
        print('\nTeam repo is empty — nothing to merge yet.')
    else:
        print(f'\nTeam repo contains {len(available)} shared file(s):')
        for fname, lines in available:
            print(f'  {fname}: {lines} lines')

        try:
            answer = input('\nMerge these into your local memory? (y/n): ').strip().lower()
        except (EOFError, KeyboardInterrupt):
            answer = 'n'

        if answer != 'y':
            print('Cancelled. Team repo cloned but not merged.')
            print('Run "Team Pull" when ready to merge.')
        else:
            total = 0
            for fname in TEAM_MEMORY_FILES:
                remote     = TEAM_REPO_DIR / fname
                local_name = TEAM_FILES_LOCAL_OVERRIDE.get(fname, fname)
                local      = mem_dir / local_name
                n = merge_table(local, remote)
                total += n

            remote_gp = TEAM_REPO_DIR / 'guard-patterns.md'
            local_gp  = ROOT / '.claude' / 'rules' / 'guard-patterns.md'
            n = merge_guard_patterns(local_gp, remote_gp)
            total += n

            remote_cp = TEAM_REPO_DIR / 'complexity_profile.md'
            local_cp  = mem_dir / 'complexity_profile.md'
            if remote_cp.exists() and not local_cp.exists():
                shutil.copy2(remote_cp, local_cp)
                total += 1

            print(f'\n{total} entries merged from team.')

    cfg['repo']        = repo_url
    cfg['joined_date'] = datetime.now().strftime('%Y-%m-%d')
    cfg['last_pull']   = datetime.now().strftime('%Y-%m-%d %H:%M')
    save_config(cfg)

    print(f'\nJoined. Team memory will sync automatically at each Start Session.')
    print('Run "Team Push" at End Session to share what you learn.')


def cmd_push_team():
    cfg = load_config()
    if not cfg.get('repo'):
        print('Team sync not configured.')
        print('Run: python tools/team_sync.py setup-team https://github.com/team/shared-memory')
        return

    if not TEAM_REPO_DIR.exists() or not (TEAM_REPO_DIR / '.git').exists():
        print('Team repo missing — re-run Setup Team.')
        return

    print('Pushing team memory...')
    count = _copy_to_repo()

    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    git(['add', '-A'], cwd=TEAM_REPO_DIR)
    rc, out, err = git(['commit', '-m', f'team sync {now}'], cwd=TEAM_REPO_DIR)

    if 'nothing to commit' in (out + err).lower():
        print('Nothing new to push — team files already up to date.')
        return

    push_ok = False
    for branch in ('main', 'master'):
        rc2, _, _ = git(['push', 'origin', branch], cwd=TEAM_REPO_DIR)
        if rc2 == 0:
            push_ok = True
            break

    if not push_ok:
        # Try setting upstream
        for branch in ('main', 'master'):
            rc2, _, _ = git(['push', '--set-upstream', 'origin', branch], cwd=TEAM_REPO_DIR)
            if rc2 == 0:
                push_ok = True
                break

    cfg['last_push'] = now
    save_config(cfg)

    if push_ok:
        print(f'Pushed {count} team file(s) to {cfg["repo"]}')
    else:
        print(f'Committed locally but push failed. Check git auth and try again.')


def cmd_team_status():
    cfg = load_config()
    if not cfg.get('repo'):
        print('Team sync not configured.')
        print('Run: python tools/team_sync.py setup-team https://github.com/team/shared-memory')
        return

    print(f'Team repo:   {cfg["repo"]}')
    print(f'Setup:       {cfg.get("setup_date", "unknown")}')
    print(f'Last pull:   {cfg.get("last_pull", "never")}')
    print(f'Last push:   {cfg.get("last_push", "never")}')

    if TEAM_REPO_DIR.exists() and (TEAM_REPO_DIR / '.git').exists():
        rc, out, _ = git(['log', '--oneline', '-5'], cwd=TEAM_REPO_DIR)
        if rc == 0 and out:
            print('\nRecent commits in team repo:')
            for line in out.splitlines():
                print(f'  {line}')

        rc2, out2, _ = git(['status', '--short'], cwd=TEAM_REPO_DIR)
        if rc2 == 0 and out2:
            print('\nUnpushed local changes:')
            for line in out2.splitlines():
                print(f'  {line}')
    else:
        print('\nTeam repo not found locally — re-run Setup Team.')

    print()
    print('Shared files:', ', '.join(TEAM_MEMORY_FILES + ['guard-patterns.md']))
    print('Personal (never shared): velocity.md, skill_scores.md, user_preferences.md,')
    print('                         session_journal.md, todo.md')


# ─── DISPATCH ─────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)

    cmd = args[0]
    if cmd == 'setup-team':
        if len(args) < 2:
            print('Usage: python tools/team_sync.py setup-team https://github.com/team/shared-memory')
            sys.exit(1)
        cmd_setup_team(args[1])
    elif cmd == 'join':
        if len(args) < 2:
            print('Usage: python tools/team_sync.py join https://github.com/team/shared-memory')
            sys.exit(1)
        cmd_join_team(args[1])
    elif cmd == 'pull-team':
        cmd_pull_team()
    elif cmd == 'push-team':
        cmd_push_team()
    elif cmd == 'team-status':
        cmd_team_status()
    else:
        print(f'Unknown command: {cmd}')
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
