#!/usr/bin/env python3
"""
One-line installer for the Claude Code memory starter kit.
Fetches setup.py from GitHub and runs it in the current directory.

Usage — run this from your project root:

  python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YehudaFrankel/clankbrain/main/install.py').read().decode())"

Or with a fork / specific branch:

  python -c "import urllib.request; exec(urllib.request.urlopen('https://raw.githubusercontent.com/YOUR/FORK/main/install.py').read().decode())"
"""

import sys
import subprocess
import urllib.request
from pathlib import Path

GITHUB_BASE = "https://raw.githubusercontent.com/YehudaFrankel/clankbrain/main"


def main():
    print("\n=== Claude Code Memory Kit — Installer ===\n")

    setup_path = Path.cwd() / "setup.py"

    # ── Fetch setup.py ──
    print("Fetching setup.py from GitHub...")
    try:
        with urllib.request.urlopen(f"{GITHUB_BASE}/setup.py", timeout=10) as resp:
            setup_path.write_bytes(resp.read())
        print("  OK\n")
    except Exception as e:
        print(f"  ERROR: Could not fetch setup.py — {e}")
        sys.exit(1)

    # ── Run setup.py as a subprocess so __file__ is defined correctly ──
    result = subprocess.run([sys.executable, str(setup_path)])
    sys.exit(result.returncode)


main()
