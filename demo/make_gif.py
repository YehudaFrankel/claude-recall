#!/usr/bin/env python3
"""
Generates demo.gif for Clankbrain README.
Run from the repo root: python demo/make_gif.py
Output: demo.gif
"""

from PIL import Image, ImageDraw, ImageFont
import os, sys

# ── Config ────────────────────────────────────────────────────────────────────
W, H       = 780, 420
BG         = (13, 17, 23)       # GitHub dark bg
FG         = (201, 209, 217)    # default text
GREEN      = (87, 232, 159)
CYAN       = (121, 192, 255)
YELLOW     = (210, 153, 34)
DIM        = (110, 118, 129)
BOLD_WHITE = (230, 237, 243)
PROMPT_COL = (57, 211, 83)

FONT_SIZE  = 15
PAD_X      = 28
PAD_Y      = 22
LINE_H     = 22

# ── Font ──────────────────────────────────────────────────────────────────────
def load_font(size):
    candidates = [
        "C:/Windows/Fonts/consola.ttf",       # Consolas (Windows)
        "C:/Windows/Fonts/cour.ttf",          # Courier New
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

font     = load_font(FONT_SIZE)
font_dim = load_font(FONT_SIZE)

# ── Helpers ───────────────────────────────────────────────────────────────────
def make_frame(lines):
    """lines = list of (text, color) tuples"""
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    # window chrome dots
    for i, dot_col in enumerate([(255,95,86),(255,189,46),(39,201,63)]):
        draw.ellipse([PAD_X + i*20, PAD_Y - 8, PAD_X + i*20 + 10, PAD_Y + 2], fill=dot_col)
    # title bar
    draw.text((W//2 - 40, PAD_Y - 7), "clankbrain", fill=DIM, font=font)
    # lines
    y = PAD_Y + 18
    for text, color in lines:
        draw.text((PAD_X, y), text, fill=color, font=font)
        y += LINE_H
    return img

def frames_for(lines, hold_ms):
    """Return (frame, duration_ms) tuples — one static frame held for hold_ms."""
    return [(make_frame(lines), hold_ms)]

# ── Script ────────────────────────────────────────────────────────────────────
# Each scene is a list of lines + hold time (ms)
scenes = [
    # ── Blank pause
    ([], 600),

    # ── Title
    ([
        ("", FG),
        ("  Clankbrain", BOLD_WHITE),
        ("  Give Claude Code a permanent memory.", DIM),
    ], 1400),

    # ── Start Session typed
    ([
        ("", FG),
        ("  Clankbrain", BOLD_WHITE),
        ("  Give Claude Code a permanent memory.", DIM),
        ("", FG),
        ("  > Start Session", CYAN),
    ], 800),

    # ── Reading memory
    ([
        ("", FG),
        ("  > Start Session", CYAN),
        ("", FG),
        ("  Reading STATUS.md ...", DIM),
        ("  Loading lessons.md — 14 lessons", DIM),
        ("  Loading errors.md  — 6 known bugs", DIM),
        ("  Loading decisions.md — 9 decisions", DIM),
        ("  Running drift check ...", DIM),
    ], 1200),

    # ── Session ready
    ([
        ("", FG),
        ("  > Start Session", CYAN),
        ("", FG),
        ("  Reading STATUS.md ...", DIM),
        ("  Loading lessons.md — 14 lessons", DIM),
        ("  Loading errors.md  — 6 known bugs", DIM),
        ("  Loading decisions.md — 9 decisions", DIM),
        ("  Running drift check ...", DIM),
        ("", FG),
        ("  Session 161 ready.", GREEN),
        ("  Last change: Feed page pagination — stale offset on filter", FG),
        ("  change. Debounce fix applied. Spinner added.", FG),
        ("", FG),
        ("  Memory: OK  14 lessons  6 errors  9 decisions", DIM),
        ("  What are we working on?", BOLD_WHITE),
    ], 2800),

    # ── Plan output
    ([
        ("  > Fix the dashboard mark-complete button", CYAN),
        ("", FG),
        ("  Plan", BOLD_WHITE),
        ("", FG),
        ("  Problem", YELLOW),
        ("  markComplete() fires before CanMarkComplete is verified", FG),
        ("  server-side — button appears active on same day.", FG),
        ("", FG),
        ("  Before   courseMarkComplete.js:84", DIM),
        ("    if (session.CanMarkComplete) { submit(); }", FG),
        ("", FG),
        ("  After", DIM),
        ("    if (session.CanMarkComplete === '1') { submit(); }", GREEN),
        ("", FG),
        ("  Files touched: 1   Lines changed: 1   Type: Bug fix", DIM),
        ("", FG),
        ("  Proceed?", BOLD_WHITE),
    ], 3200),

    # ── Verified
    ([
        ("  > yes", CYAN),
        ("", FG),
        ("  Edit applied.", DIM),
        ("", FG),
        ("  courseMarkComplete.js:84", DIM),
        ("  if (session.CanMarkComplete === '1') { submit(); }", GREEN),
        ("", FG),
        ("  Verified. Exact match to plan.", GREEN),
        ("  No other callers affected.", DIM),
    ], 2400),

    # ── End Session
    ([
        ("", FG),
        ("  > End Session", CYAN),
        ("", FG),
        ("  Extracting lessons ...", DIM),
        ("", FG),
        ("  1. CanMarkComplete must be compared as string '1',", FG),
        ("     not truthy — JS coerces '0' to true.", FG),
        ("", FG),
        ("  Updating STATUS.md, lessons.md, pushing ...", DIM),
        ("", FG),
        ("  Session 161 complete. Memory pushed to GitHub.", GREEN),
        ("  Next session Claude loads this automatically.", DIM),
    ], 3000),

    # ── Hold end
    ([
        ("", FG),
        ("  Session 161 complete. Memory pushed to GitHub.", GREEN),
        ("  Next session Claude loads this automatically.", DIM),
        ("", FG),
        ("  github.com/YehudaFrankel/clankbrain", DIM),
    ], 2000),
]

# ── Build frames ──────────────────────────────────────────────────────────────
all_frames   = []
all_durations = []

for lines, hold_ms in scenes:
    f, d = frames_for(lines, hold_ms)[0]
    all_frames.append(f)
    all_durations.append(hold_ms)

# ── Save ──────────────────────────────────────────────────────────────────────
out = os.path.join(os.path.dirname(__file__), "..", "demo.gif")
all_frames[0].save(
    out,
    save_all=True,
    append_images=all_frames[1:],
    duration=all_durations,
    loop=0,
    optimize=False,
)
print(f"Saved {out}  ({len(all_frames)} frames)")
