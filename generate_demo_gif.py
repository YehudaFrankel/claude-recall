#!/usr/bin/env python3
"""
Generate demo.gif for the claude-recall README.
Renders a terminal animation showing a full session.
Run: python generate_demo_gif.py
"""

from PIL import Image, ImageDraw, ImageFont
import sys

# ── Theme ──────────────────────────────────────────────
BG      = (13,  17,  23)
SURFACE = (22,  27,  34)
BORDER  = (48,  54,  61)
GREEN   = (63,  185, 80)
AMBER   = (210, 153, 34)
PURPLE  = (196, 181, 253)
TEXT    = (230, 237, 243)
MUTED   = (139, 148, 158)
DIM     = (72,  79,  88)
ACCENT  = (139, 92,  246)
RED     = (255, 95,  87)
YELLOW  = (254, 188, 46)
GGREEN  = (40,  200, 64)

W, H     = 720, 430
FS       = 13
LH       = 21      # line height
PX       = 22      # padding x
PY       = 14      # padding y top (below bar)
BAR      = 36      # title bar height

# ── Font ───────────────────────────────────────────────
def load_font(size):
    for path in [
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/cour.ttf",
        "C:/Windows/Fonts/lucon.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    print("Warning: using default font (output may look rough)")
    return ImageFont.load_default()

font = load_font(FS)

def tw(text):
    """text width in pixels"""
    try:
        return int(font.getlength(text))
    except Exception:
        return len(text) * 8

# ── Frame renderer ─────────────────────────────────────
def render(lines, blink_on=True):
    img = Image.new('RGB', (W, H), BG)
    d   = ImageDraw.Draw(img)

    # Outer border
    d.rounded_rectangle([0, 0, W-1, H-1], radius=8, outline=BORDER, width=1)

    # Title bar
    d.rounded_rectangle([0, 0, W-1, BAR], radius=8, fill=SURFACE)
    d.rectangle([0, BAR//2, W-1, BAR], fill=SURFACE)
    d.line([0, BAR, W-1, BAR], fill=BORDER, width=1)

    # Traffic lights
    for i, c in enumerate([RED, YELLOW, GGREEN]):
        cx = 14 + i * 18
        cy = BAR // 2
        d.ellipse([cx-5, cy-5, cx+5, cy+5], fill=c)

    d.text((54, BAR//2 - FS//2), "bash — your-project/", fill=DIM, font=font)

    # Content lines
    y = BAR + PY
    cur_x = cur_y = None

    for ln in lines:
        kind = ln[0]
        txt  = ln[1] if len(ln) > 1 else ''
        extra = ln[2] if len(ln) > 2 else ''   # partial typed text

        if y + LH > H - 8:
            break  # clip

        if kind == 'gap':
            y += LH // 2
            continue

        if kind == 'sep':
            d.text((PX, y), txt, fill=BORDER, font=font)

        elif kind == 'cmd':
            d.text((PX, y), '$ ', fill=DIM, font=font)
            cx2 = PX + tw('$ ')
            d.text((cx2, y), txt + extra, fill=TEXT, font=font)
            if extra is not None:  # typing in progress → cursor after text
                cur_x = cx2 + tw(txt + extra)
                cur_y = y

        elif kind == 'prompt':
            d.text((PX, y), '$ ', fill=DIM, font=font)
            cur_x = PX + tw('$ ')
            cur_y = y

        elif kind == 'ok':
            d.text((PX + 16, y), txt, fill=GREEN, font=font)

        elif kind == 'dim':
            d.text((PX + 16, y), txt, fill=MUTED, font=font)

        elif kind == 'green':
            d.text((PX, y), txt, fill=GREEN, font=font)

        elif kind == 'warn':
            d.text((PX, y), txt, fill=AMBER, font=font)

        elif kind == 'add':
            d.text((PX, y), txt, fill=PURPLE, font=font)

        elif kind == 'cmt':
            d.text((PX, y), txt, fill=DIM, font=font)

        y += LH

    # Blinking cursor
    if blink_on and cur_x is not None and cur_y is not None:
        d.rectangle([cur_x, cur_y, cur_x + 7, cur_y + FS + 2], fill=ACCENT)
    elif blink_on and cur_x is None:
        # cursor after last line
        d.rectangle([PX, y, PX + 7, y + FS + 2], fill=ACCENT)

    return img

# ── Animation script ───────────────────────────────────
# Each entry: (lines_list, hold_ms, blink_cursor)
# lines_list is a list of tuples: (kind, text)
# kinds: 'gap','sep','cmd','prompt','ok','dim','green','warn','add','cmt'

def build_frames():
    """Returns list of (PIL.Image, duration_ms)"""
    frames = []

    def add(lines, hold_ms, blink=True, blink_frames=1):
        """Add 'hold_ms' of content, alternating cursor every ~500ms."""
        if blink_frames <= 1 or hold_ms < 500:
            frames.append((render(lines, blink), hold_ms))
        else:
            # split into blink_frames alternating frames
            per = hold_ms // blink_frames
            for i in range(blink_frames):
                frames.append((render(lines, i % 2 == 0), per))

    # ── Phase 1: Morning ───────────────────────────────
    base = [('prompt',)]
    add(base, 600, blink_frames=2)

    # type "Start Session"
    cmd = 'Start Session'
    for i in range(len(cmd) + 1):
        typed = cmd[:i]
        state = [('cmd', '', typed)]
        add(state, 70, blink=(i == len(cmd)))

    # outputs appear one by one
    outputs1 = [
        ('ok',  '✓ memory.ps1 pull — OK'),
        ('ok',  '✓ no drift detected'),
        ('ok',  '✓ STATUS.md — Session 97'),
        ('ok',  '✓ 5 lessons loaded'),
        ('ok',  '✓ 4 decisions loaded'),
        ('ok',  '✓ 13 skills ready'),
    ]
    acc = [('cmd', 'Start Session')]
    for out in outputs1:
        add(acc, 280)
        acc = acc + [out]
    add(acc, 300)

    acc = acc + [('gap',), ('green', 'Session 97 ready.')]
    add(acc, 400, blink_frames=2)

    acc = acc + [('dim', 'Last change: backup finalized + quality hardening')]
    add(acc, 200)
    acc = acc + [('dim', 'What are we working on?')]
    add(acc, 1000, blink_frames=4)

    # ── Phase 2: Working ───────────────────────────────
    acc = acc + [
        ('gap',),
        ('sep', '── working ─────────────────────────────────────'),
        ('cmt', '// you edit dashboard.js — hook fires automatically'),
    ]
    add(acc, 600, blink_frames=2)

    acc = acc + [('gap',), ('warn', 'DRIFT DETECTED — MISSING from js_functions.md:')]
    add(acc, 500)

    acc = acc + [('add', '  + submitFeedback   [dashboard.js]')]
    add(acc, 250)
    acc = acc + [('add', '  + loadFeedItems    [dashboard.js]')]
    add(acc, 250)
    acc = acc + [('dim', "Run 'Analyze Codebase' to update memory.")]
    add(acc, 800, blink_frames=3)

    acc = acc + [('gap',)]
    cmd2 = 'Analyze Codebase'
    for i in range(len(cmd2) + 1):
        typed = cmd2[:i]
        state = acc + [('cmd', '', typed)]
        add(state, 70, blink=(i == len(cmd2)))

    acc = acc + [('cmd', 'Analyze Codebase')]
    for out in [('ok', '✓ submitFeedback — documented'), ('ok', '✓ loadFeedItems — documented')]:
        add(acc, 350)
        acc = acc + [out]
    acc = acc + [('green', 'Memory updated. No drift.')]
    add(acc, 900, blink_frames=3)

    # ── Phase 3: End of day ────────────────────────────
    acc = acc + [
        ('gap',),
        ('sep', '── end of day ───────────────────────────────────'),
    ]
    add(acc, 300, blink_frames=2)

    cmd3 = 'End Session'
    for i in range(len(cmd3) + 1):
        typed = cmd3[:i]
        state = acc + [('cmd', '', typed)]
        add(state, 70, blink=(i == len(cmd3)))

    acc = acc + [('cmd', 'End Session'), ('dim', 'Running /learn…')]
    add(acc, 600)

    for out in [
        ('ok',  '✓ 2 new lessons extracted'),
        ('ok',  '✓ decisions.md updated'),
        ('dim', 'Updating memory files…'),
        ('ok',  '✓ STATUS.md — Session 97 → 98'),
        ('ok',  '✓ memory.ps1 push — pushed to GitHub'),
    ]:
        add(acc, 350)
        acc = acc + [out]

    acc = acc + [('gap',), ('green', 'Session complete. Memory pushed to GitHub.')]
    add(acc, 3000, blink_frames=6)   # hold 3s before loop

    return frames


# ── Main ───────────────────────────────────────────────
def main():
    print("Generating frames…")
    frames = build_frames()
    print(f"  {len(frames)} frames")

    imgs      = [f[0] for f in frames]
    durations = [f[1] for f in frames]

    out = "demo.gif"
    imgs[0].save(
        out,
        save_all=True,
        append_images=imgs[1:],
        duration=durations,
        loop=0,
        optimize=False,
    )
    size_kb = __import__('os').path.getsize(out) // 1024
    print(f"  Saved {out}  ({size_kb} KB,  {len(frames)} frames)")


if __name__ == '__main__':
    main()
