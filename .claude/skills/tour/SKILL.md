---
name: tour
description: A 5-minute interactive walkthrough of Clankbrain. Shows the user the magic — memory, lessons, regret log, plans — by demonstrating each one in real time. Triggers on "tour", "show me how this works", "walkthrough", "first time", "new user", "show me the magic".
allowed-tools: Read, Write, Edit, Bash
---

# Skill: tour

## Trigger
Run when user types `tour`, or right after `kit-health` for a new user. Also good for "show me how this works" or "I'm new here."

## Goal
In 5 minutes, make the user FEEL the compound learning loop — not read about it. By the end, they should understand:
1. Memory persists across sessions
2. Lessons get extracted automatically
3. Regret log prevents repeated mistakes
4. Skills are reusable workflows
5. The system gets better as they use it

## How to run the tour

This is INTERACTIVE. Don't dump info. Walk them through it step by step, waiting for them to type the next thing. Each step should feel like they discovered something themselves.

---

### Step 1: Welcome (10 seconds)

```
Welcome to Clankbrain. The 5-minute tour shows you what makes this kit different.

The TL;DR: I remember everything you tell me, and I get smarter every session.

Let's prove it. I'll walk you through 4 demos. Type "next" when you're ready.
```

Wait for "next."

---

### Step 2: Memory demo (60 seconds)

```
Demo 1: Memory.

Tell me one thing about your project — anything. Could be:
- "I'm building a recipe app"
- "My team uses TypeScript"
- "I prefer tabs over spaces"

Just type it.
```

Wait for input.

When they answer, save it to `.claude/memory/user.md` with format:
```markdown
---
name: user-tour-fact
description: Fact captured during tour
type: user
---
[Their fact]

## Source
> User said during tour walkthrough
— Tour
```

Then respond:
```
Got it. I just saved that to `.claude/memory/user.md`.

Try this: close this session, open a new one tomorrow, and ask "what do you know about my project?"
I'll remember exactly what you just told me.

That's the foundation. Memory persists.

Type "next" for the second demo.
```

Wait for "next."

---

### Step 3: Regret log demo (90 seconds)

```
Demo 2: Mistakes never repeat.

Pretend you just learned a hard lesson. Tell me something you'd never want to do again. Examples:
- "Never deploy on Friday afternoons"
- "Don't use eval() in JavaScript"
- "Always backup before schema migrations"

Type one.
```

Wait for input.

When they answer, append to `.claude/memory/tasks/regret.md`:
```markdown
| [today's date] | [Their lesson] | Captured during tour walkthrough |
```

Then respond:
```
Saved to regret.md.

Now if you ever ask me about [topic], I'll automatically pull that lesson from memory and warn you.
You don't have to remember it. The system does.

That's the compound learning loop. Mistakes accumulate into immunity.

Type "next" for the third demo.
```

Wait for "next."

---

### Step 4: Skills demo (60 seconds)

```
Demo 3: Reusable workflows.

The kit ships with ~30 skills. Each one is a workflow that runs when you need it.

Examples:
- /plan — walks you through planning a new feature
- /learn — extracts lessons from this session
- /recall [topic] — searches memory for what we know
- prototype-hypothesis — forces a real question before building anything

You don't have to memorize them. Just type what you want and I'll match a skill.

Want to try one? Type: /recall my project
```

Wait for input. When they run /recall, it'll find what they typed in Step 2.

```
See? You just told me a thing 3 minutes ago, and I can recall it on demand.

Now imagine that for 6 months of project decisions. That's what compound memory feels like.

Type "next" for the last demo.
```

Wait for "next."

---

### Step 5: Discovery vs Delivery (60 seconds)

```
Demo 4: The kit knows when to be careful vs fast.

Two modes:
- BUILD TO LEARN (discovery) — fast, sloppy, throwaway. Testing if something works.
- BUILD TO EARN (delivery) — careful, planned, conventions enforced. Real production code.

Most workflows treat them the same. The kit doesn't.

When you start building something, declare the mode:
> "Build mode: learn — testing whether dark mode increases retention."
> "Build mode: earn — implementing payment processing from the build plan."

Different conventions kick in. You stay fast in discovery, careful in delivery.

That's the system in 5 minutes.
```

---

### Step 6: What's next (30 seconds)

```
You've seen all 4 magic moments:
✓ Memory persists across sessions
✓ Mistakes go in regret.md and don't repeat
✓ Skills are reusable workflows on demand
✓ Build modes keep you fast in discovery, safe in delivery

Two things to do now:

1. Type "Start Session" to begin real work
2. Read docs/CHEATSHEET.md (one page) for the 5 commands you'll use daily

Everything else is automatic. The kit gets better as you use it.

Welcome aboard.
```

End the tour.

---

## Cleanup (optional)

The user.md and regret.md entries from the tour are real. Don't delete them automatically. If the user wants a fresh start later, they can edit those files themselves.

If user says "this was just a tour, can you remove that fact" — then delete the entries.

## Why this skill exists

New users abandon the kit because the magic isn't obvious. They install, type "Start Session," see nothing impressive, and bounce.

The tour MAKES the magic obvious. By the end, they've personally seen:
- Memory save and recall
- A mistake become a permanent rule
- A skill execute on demand
- Build mode declared

5 minutes. They get it. Then they keep using the kit.

## When NOT to use

- User is already an experienced kit user
- User is in the middle of real work (don't interrupt)
- User just wants to know one specific thing (use /recall instead)
