"""
Generate demo.gif for clankbrain — animated terminal walkthrough.
Run: python make_demo.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

# ── Config ────────────────────────────────────────────────────────────────────
W, H       = 720, 420
BG         = (15, 17, 23)       # near-black background
GREEN      = (80, 220, 100)     # prompt / success
AMBER      = (255, 185, 70)     # commands
WHITE      = (220, 220, 220)    # normal text
MUTED      = (100, 110, 130)    # dim text
CYAN       = (80, 200, 220)     # section headers
PURPLE     = (180, 130, 255)    # memory labels
PAD_X      = 28
PAD_Y      = 22
LINE_H     = 22
FONT_SIZE  = 14

# ── Font ──────────────────────────────────────────────────────────────────────
def load_font(size):
    for path in [
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/cour.ttf",
        "C:/Windows/Fonts/lucon.ttf",
    ]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

FONT  = load_font(FONT_SIZE)
FONTB = load_font(FONT_SIZE)

# ── Scene definition ──────────────────────────────────────────────────────────
# Each scene = list of (color, text) lines + hold duration in frames (×40ms)
SCENES = [
    # Scene 0 — npx install
    {
        "hold": 60,
        "lines": [
            (MUTED,  "  clankbrain — memory for Claude Code"),
            (MUTED,  ""),
            (GREEN,  "  $ npx clankbrain"),
            (MUTED,  ""),
            (WHITE,  "  Fetching setup.py from GitHub...  done."),
            (MUTED,  ""),
            (CYAN,   "  Choose mode:"),
            (WHITE,  "    1) Full  — memory + skills + autonomous workflows"),
            (WHITE,  "    2) Lite  — memory only, zero Python"),
            (MUTED,  ""),
            (AMBER,  "  > 1"),
        ],
    },
    # Scene 1 — setup complete
    {
        "hold": 55,
        "lines": [
            (MUTED,  "  clankbrain — memory for Claude Code"),
            (MUTED,  ""),
            (GREEN,  "  Setup complete."),
            (MUTED,  ""),
            (WHITE,  "  Created:"),
            (GREEN,  "    .claude/CLAUDE.md          project instructions"),
            (GREEN,  "    .claude/memory/MEMORY.md   memory index"),
            (GREEN,  "    .claude/skills/             10 built-in skills"),
            (MUTED,  ""),
            (WHITE,  "  Open Claude Code and type:"),
            (AMBER,  "    Start Session"),
        ],
    },
    # Scene 2 — Start Session
    {
        "hold": 60,
        "lines": [
            (MUTED,  "  Claude Code"),
            (MUTED,  ""),
            (AMBER,  "  > Start Session"),
            (MUTED,  ""),
            (WHITE,  "  Pulling memory from last session..."),
            (MUTED,  ""),
            (PURPLE, "  [user]      senior backend dev, Java + SQL Server"),
            (PURPLE, "  [feedback]  never mock the DB in tests — burned before"),
            (PURPLE, "  [feedback]  always show plan before editing"),
            (PURPLE, "  [project]   auth rewrite due Friday — compliance req"),
            (MUTED,  ""),
            (GREEN,  "  Ready. Last change: fixed scheduler double-send bug."),
            (WHITE,  "  What are we working on?"),
        ],
    },
    # Scene 3 — working
    {
        "hold": 55,
        "lines": [
            (MUTED,  "  Claude Code"),
            (MUTED,  ""),
            (AMBER,  "  > add the resend endpoint"),
            (MUTED,  ""),
            (WHITE,  "  Checking if resend already exists..."),
            (MUTED,  "    Grep: appResendEmail in HFmtWebservice.java — not found"),
            (MUTED,  ""),
            (WHITE,  "  Plan:"),
            (WHITE,  "    1. Add appResendEmail to noCheckSessionFunc"),
            (WHITE,  "    2. Route in if/else chain (line 4821)"),
            (WHITE,  "    3. Implement — calls nfp.adminResendEmail()"),
            (MUTED,  ""),
            (CYAN,   "  Proceed? (yes/no)"),
        ],
    },
    # Scene 4 — End Session
    {
        "hold": 65,
        "lines": [
            (MUTED,  "  Claude Code"),
            (MUTED,  ""),
            (AMBER,  "  > End Session"),
            (MUTED,  ""),
            (WHITE,  "  Extracting lessons from this session..."),
            (MUTED,  ""),
            (GREEN,  "  Saved to memory/lessons.md:"),
            (WHITE,  "    resend endpoint pattern — addRow vs executeSql"),
            (WHITE,  "    noCheckSessionFunc must include all public endpoints"),
            (MUTED,  ""),
            (GREEN,  "  Memory updated. Session 138 complete."),
            (MUTED,  ""),
            (PURPLE, "  Next session picks up here automatically."),
        ],
    },
]

# ── Render helpers ────────────────────────────────────────────────────────────
def render_scene(lines):
    img = Image.new("RGB", (W, H), BG)
    d   = ImageDraw.Draw(img)

    # top bar
    d.rectangle([0, 0, W, 36], fill=(28, 30, 38))
    for i, col in enumerate([(220,80,80),(220,180,60),(80,200,100)]):
        d.ellipse([12 + i*20, 11, 24 + i*20, 23], fill=col)
    d.text((52, 10), "terminal", font=FONT, fill=MUTED)

    y = 52
    for color, text in lines:
        d.text((PAD_X, y), text, font=FONT, fill=color)
        y += LINE_H

    # bottom bar
    d.rectangle([0, H-28, W, H], fill=(28, 30, 38))
    d.text((PAD_X, H-20), "clankbrain v2.0.0  |  memory: local  |  npx clankbrain",
           font=FONT, fill=MUTED)
    return img


def make_frames(scene):
    """Return list of (img, duration_ms) pairs for one scene."""
    base  = render_scene(scene["lines"])
    hold  = scene["hold"]
    frames = []

    # fade in (8 frames)
    black = Image.new("RGB", (W, H), BG)
    for i in range(8):
        alpha = int(255 * i / 8)
        blended = Image.blend(black, base, i / 8)
        frames.append((blended, 40))

    # hold
    for _ in range(hold):
        frames.append((base, 40))

    return frames


# ── Build GIF ────────────────────────────────────────────────────────────────
all_frames  = []
all_durations = []

for scene in SCENES:
    for img, dur in make_frames(scene):
        all_frames.append(img)
        all_durations.append(dur)

out = "demo.gif"
all_frames[0].save(
    out,
    save_all=True,
    append_images=all_frames[1:],
    duration=all_durations,
    loop=0,
    optimize=False,
)

kb = os.path.getsize(out) // 1024
print(f"Saved {out}  ({kb} KB,  {len(all_frames)} frames)")
