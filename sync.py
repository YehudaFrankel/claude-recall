#!/usr/bin/env python3
"""
Engram memory sync — optional cross-machine sync for your memory files.

Memory stays local by default. This script is opt-in — run it only if you
want memory to follow you across machines.

Your memory goes to YOUR private repo. Nothing touches engram.

Usage:
  python sync.py setup https://github.com/you/my-memory   # first time setup
  python sync.py push                                       # after each session
  python sync.py pull                                       # on a new machine
  python sync.py status                                     # check sync state
"""

import json
import subprocess
import sys
from pathlib import Path

MEMORY_DIR  = Path(".claude/memory")
CONFIG_FILE = Path(".claude/.sync-config.json")


def run(cmd, cwd=None, capture=False):
    result = subprocess.run(
        cmd, shell=True, cwd=str(cwd) if cwd else None,
        capture_output=capture, text=True
    )
    return result


def load_config():
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return {}


def save_config(config):
    CONFIG_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")


def require_memory_dir():
    if not MEMORY_DIR.exists():
        print("ERROR: .claude/memory/ not found. Run Setup Memory first.")
        sys.exit(1)


def setup(repo_url):
    require_memory_dir()

    # Save config
    config = {"repo": repo_url}
    save_config(config)

    git_dir = MEMORY_DIR / ".git"
    if not git_dir.exists():
        print("Initialising git in .claude/memory/...")
        run("git init", cwd=MEMORY_DIR)
        run("git checkout -b main", cwd=MEMORY_DIR, capture=True)
        run(f"git remote add origin {repo_url}", cwd=MEMORY_DIR)
    else:
        print("Git already initialised — updating remote URL...")
        run(f"git remote set-url origin {repo_url}", cwd=MEMORY_DIR)

    # Create a .gitignore inside memory so nothing unexpected gets committed
    gitignore = MEMORY_DIR / ".gitignore"
    if not gitignore.exists():
        gitignore.write_text("*.pyc\n__pycache__/\n", encoding="utf-8")

    # Initial commit and push
    run("git add -A", cwd=MEMORY_DIR)
    result = run('git commit -m "Initial memory sync from engram"', cwd=MEMORY_DIR, capture=True)

    if "nothing to commit" in (result.stdout + result.stderr):
        print("Memory directory is empty — nothing committed yet.")
        print(f"\nSync configured. Remote: {repo_url}")
        print("After your first End Session, run: python sync.py push")
        return

    push_result = run("git push -u origin main", cwd=MEMORY_DIR, capture=True)
    if push_result.returncode != 0:
        # GitHub may require authentication — surface the error clearly
        print("\nPush failed. This usually means:")
        print("  1. The GitHub repo doesn't exist yet — create it at github.com/new (private)")
        print("  2. Authentication is needed — run: gh auth login")
        print(f"\nError: {push_result.stderr.strip()}")
        sys.exit(1)

    print(f"\nSync set up successfully.")
    print(f"  Remote: {repo_url}")
    print(f"  Memory pushed.")
    print(f"\nFrom now on, after each End Session run: python sync.py push")
    print(f"On a new machine, run: python sync.py pull")


def push():
    require_memory_dir()

    git_dir = MEMORY_DIR / ".git"
    if not git_dir.exists():
        print("Sync not set up. Run: python sync.py setup https://github.com/you/repo")
        sys.exit(1)

    run("git add -A", cwd=MEMORY_DIR)
    result = run('git commit -m "Session memory update"', cwd=MEMORY_DIR, capture=True)

    if "nothing to commit" in (result.stdout + result.stderr):
        print("Memory already up to date — nothing to push.")
        return

    push_result = run("git push origin main", cwd=MEMORY_DIR, capture=True)
    if push_result.returncode == 0:
        print("Memory synced to remote.")
    else:
        print(f"Push failed: {push_result.stderr.strip()}")
        print("Check your network connection and GitHub authentication.")
        sys.exit(1)


def pull():
    config = load_config()
    repo_url = config.get("repo")

    git_dir = MEMORY_DIR / ".git"

    if git_dir.exists():
        # Already set up — just pull latest
        result = run("git pull origin main", cwd=MEMORY_DIR, capture=True)
        if result.returncode == 0:
            print("Memory pulled from remote.")
        else:
            print(f"Pull failed: {result.stderr.strip()}")
            sys.exit(1)

    elif repo_url:
        # Config exists but not cloned yet — clone into memory dir
        MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        result = run(f"git clone {repo_url} .", cwd=MEMORY_DIR, capture=True)
        if result.returncode == 0:
            print("Memory pulled from remote.")
        else:
            print(f"Clone failed: {result.stderr.strip()}")
            sys.exit(1)

    else:
        print("No sync configured on this machine.")
        print("Run: python sync.py setup https://github.com/you/repo")
        sys.exit(1)


def status():
    git_dir = MEMORY_DIR / ".git"
    config  = load_config()

    if not MEMORY_DIR.exists():
        print("Status: memory directory not found — run Setup Memory first")
        return

    if not git_dir.exists():
        print("Status: local only (no sync configured)")
        print("To enable sync: python sync.py setup https://github.com/you/repo")
        return

    repo_url = config.get("repo", "unknown")
    print(f"Status: sync enabled")
    print(f"  Remote: {repo_url}")

    result = run("git status --short", cwd=MEMORY_DIR, capture=True)
    lines = result.stdout.strip()
    if lines:
        print(f"  Unpushed changes:")
        for line in lines.splitlines():
            print(f"    {line}")
        print("  Run: python sync.py push")
    else:
        print("  Up to date — nothing to push")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == "setup":
        if len(sys.argv) < 3:
            print("Usage: python sync.py setup https://github.com/you/private-repo")
            sys.exit(1)
        setup(sys.argv[2])

    elif cmd == "push":
        push()

    elif cmd == "pull":
        pull()

    elif cmd == "status":
        status()

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
