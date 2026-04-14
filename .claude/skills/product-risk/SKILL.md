---
name: product-risk
description: "Four Big Risks product validation. Two modes: evaluate (score an existing product Red/Yellow/Green) or create (validate idea + generate working prototypes + full project scaffolding). Triggers on: /product-risk, evaluate this product, validate this idea, new product, is this worth building, product risk check, run the four risks."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, WebFetch
---

# Skill: product-risk

**Trigger:** `/product-risk`, `"evaluate this product"`, `"validate this idea"`, `"new product"`, `"is this worth building"`, `"product risk check"`, `"run the four risks"`

---

## Detect Mode

If the user says "evaluate", "score", "check", "audit", or names an existing project → **Evaluate Mode**
If the user says "create", "new", "build", "idea", "I want to make" → **Create Mode**
If ambiguous, ask: "Are we evaluating an existing product or validating a new idea?"

---

## EVALUATE MODE — Score an existing product

### Step 1: Identify the product

Ask: "Which product are we evaluating?"

If it's a project in this workspace, read its plan file, STATUS.md, or CLAUDE.md for context. If it's external, ask the user to describe it in 2-3 sentences.

### Step 2: Walk through the Four Risks

For each risk, ask 2-3 targeted questions. Listen to the answers. Don't lecture — extract signal.

**1. Value Risk (Will they buy it?)**
- Who specifically is the target user? Not "developers" — which developers, doing what, hitting what pain?
- What do they do today without this product? (If the answer is "nothing" or "it's fine" — red flag)
- Would they pay for it? How much? (If the answer is vague — yellow flag)

**2. Usability Risk (Can they use it?)**
- How many steps from "I found this" to "I got value"? (More than 5 = yellow. More than 10 = red)
- Does it require knowledge the target user doesn't have?
- Has anyone outside the builder actually tried it?

**3. Feasibility Risk (Can we build it?)**
- What's the core technical challenge? Is it solved or speculative?
- How long to MVP? (If the answer is "6 months" for a solo builder — red flag)
- What dependencies exist? (Third-party APIs, platforms, approvals)

**4. Viability Risk (Should we do this?)**
- How does it make money? When?
- What's the competitive landscape? Why would someone choose this over alternatives?
- Does the builder have an unfair advantage? (Domain expertise, existing audience, distribution)

### Step 3: Score and output

Rate each risk:
- **Green** — validated or low risk
- **Yellow** — plausible but unproven, needs testing
- **Red** — serious concern, could kill the product

Output format:

```
## Product Risk Scorecard — [Product Name]
Date: [YYYY-MM-DD]

| Risk | Score | Summary |
|------|-------|---------|
| Value (Will they buy?) | [color] | [one line] |
| Usability (Can they use?) | [color] | [one line] |
| Feasibility (Can we build?) | [color] | [one line] |
| Viability (Should we do this?) | [color] | [one line] |

### Biggest risk: [which one]
[2-3 sentences on what specifically is unproven and how to test it]

### Next action
[One concrete thing to do this week to de-risk the biggest gap]
```

Save the scorecard to the memory directory as `product-risk-[name].md` if the user wants to keep it.

**Stop here for evaluate mode.**

---

## CREATE MODE — Validate + Prototype + Scaffold

### Phase 1: The Idea (5 minutes)

Ask these questions one at a time. Wait for each answer before proceeding.

1. "What problem are you solving? Describe the pain, not the solution."
2. "Who has this problem? Be specific — job title, situation, frequency."
3. "What do they do today? What's the current workaround?"
4. "Why would they switch to your thing?"

Summarize back: "So you're building [X] for [Y] because [Z]. Right?"

### Phase 2: Four Risk Gate (10 minutes)

Run the same 4-risk evaluation from Evaluate Mode, but against the idea — not an existing product. Be honest. If a risk is red, say so plainly:

> "Value risk is red — you described the user as 'everyone who codes.' That's not a customer, that's a hope. Who specifically would pay $X/month for this? Give me a name or a job title."

**Kill gate:** If 2+ risks are red, stop and say:
> "Two risks are red. Building a prototype now would waste time. Here's what to validate first: [specific actions]. Come back when you have answers."

Do NOT proceed to Phase 3 with 2+ red risks. The skill's job is to prevent building things nobody wants.

If 0-1 risks are red, proceed.

### Phase 3: Product Shape (10 minutes)

Now that the idea is validated, define what to build:

1. "What are the 3-5 core screens a user would see?"
2. "What's the one action that delivers the core value? (The thing they came for)"
3. "What's the simplest version that proves the idea works?"

From the answers, propose:
- Page list (e.g., Landing, Dashboard, Settings)
- Core user flow (e.g., Sign up -> Connect repo -> See first sync)
- Design direction (ask: "Warm and friendly, or clean and technical? Dark or light? Any products you want it to feel like?")

Wait for approval before generating.

### Phase 4: Generate Prototypes (20 minutes)

Build working HTML/CSS/JS prototypes. Not wireframes — real interactive pages with:
- Actual navigation between pages
- Realistic sample data (not lorem ipsum)
- Responsive layout (mobile-first)
- Click handlers, modals, transitions
- Design tokens as CSS variables (easy to re-skin later)

**Rules for prototypes:**
- One HTML file per page (self-contained — inline CSS and JS)
- Add `<!-- PROTOTYPE — [Product Name] — generated by /product-risk create -->` at the top
- Use the design direction from Phase 3
- Every interactive element should work (buttons open modals, tabs switch, forms validate)
- Include realistic content that shows what the product actually does

Ask the user where to place the prototype files. Default to the project root or a `prototypes/` directory.

### Phase 5: Project Scaffolding

Generate full project context so the next session starts with everything:

**1. Plan file** → save to the memory `plans/` directory
```markdown
# Plan: [Product Name]
**Status:** Draft
**Created:** [date]

## Problem
[From Phase 1 answers]

## Risk Assessment
[Scorecard from Phase 2]

## Core Screens
[From Phase 3]

## Technical Spec
[Stack recommendation based on what was discussed]

## Open Questions
[Any unresolved items from the conversation]
```

**2. Decisions file entry** → append to `decisions.md` in memory
```markdown
## [date] - [Product Name]: initial product decisions
**Decision:** [Key choices made during the session]
**Rationale:** [Why, based on 4-risk analysis]
```

**3. Memory index entry** → append to `MEMORY.md`
```
- [Product Name plan](plans/[product-name].md) — Status: Draft. [one-line summary]
```

### Phase 6: Report

```
## Product Risk Create — Complete

### Idea: [name]
[One sentence]

### Risk Scorecard
| Risk | Score |
|------|-------|
| Value | [color] |
| Usability | [color] |
| Feasibility | [color] |
| Viability | [color] |

### Generated
- [N] prototype pages: [list filenames]
- Plan file: [path]
- Decisions logged
- Memory index updated

### Next steps
1. [Most important thing to validate]
2. [Second priority]
3. [Third priority]
```

---

## Notes

- The kill gate in Phase 2 is the most important part of this skill. Building prototypes for a bad idea is worse than building nothing.
- Prototypes are starting points, not finished products. They should look real enough to test with users but be understood as disposable.
- If the user says "skip the questions" or "just build it" — push back once: "The questions take 10 minutes. Building the wrong thing takes 10 sessions. Which is more expensive?" If they insist, proceed but note the risks as yellow/unvalidated.
