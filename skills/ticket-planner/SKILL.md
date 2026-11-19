---
name: ticket-planner
description: Acts as a PM breaking a big, underspecified idea into a sequence of individually-shippable tickets, written directly into a repo's tickets/ folder in the exact format ticket-queue-init scaffolds — so each one gets auto-picked up by that repo's ticket queue and run through its ship skill unattended. Use when the user has a large or vague idea ("I want to add X", "let's build Y") and wants it turned into a real backlog instead of one giant ticket, or asks to "break this down into tickets," "plan this out," "turn this into a backlog," or "split this into work items."
---

# ticket-planner: turn a big idea into a queue of shippable tickets

This is the PM half of the pipeline `ticket-queue-init` scaffolds and `ship`
executes: you take a big, fuzzy idea and produce a *sequence* of small,
independently-shippable tickets, each one small enough that the queue's
refine phase and the `ship` loop can pick it up and land it without a human
in the loop. You are not implementing anything here — you are writing
ticket files. Assume the target repo already has `tickets/` scaffolded (if
it doesn't, tell the user and point them at `ticket-queue-init` first,
don't scaffold it yourself here).

## Step 0: understand the idea before decomposing it

Don't jump straight to writing tickets from a one-line prompt. Read
whatever's needed to actually understand the surface area:

- Skim the repo's own ground-truth docs if it has them (`DESIGN.md`,
  `PROMPT.md`, `README.md`, existing `tickets/*.md` for the house style).
- If the idea is genuinely large (a new feature area, not a tweak), ask 1-3
  clarifying questions before decomposing — scope, priority order, and
  anything explicitly out of bounds. Don't ask more than that; a PM who
  interrogates a stakeholder for twenty minutes before writing anything
  down isn't being thorough, they're stalling. Default to reasonable
  judgment calls on anything minor and say what you assumed.
- If the repo has an existing ticket backlog, skim it — don't duplicate
  work that's already queued, and match its granularity/style.

## Step 1: decompose into right-sized tickets

The queue this feeds is only as good as the ticket sizing. Calibrate
against what actually lands cleanly in one `ship` pass:

- **One ticket = one coherent, reviewable change.** If you can't describe
  what it does in one or two sentences without "and also," split it.
- **Vertical slices over horizontal layers**, where the idea allows it — a
  ticket that ships "add sorting to the file list" end-to-end beats one
  ticket for "add a sort icon" and a separate one for "wire up the sort
  logic." The `ship` loop gates on a working, reviewed diff each round;
  half-a-feature tickets don't have anything real to gate on.
- **Order by dependency.** If a later ticket's change would conflict with
  or build on an earlier one's, note the dependency in that later ticket's
  `Why` (the queue runs tickets one at a time by priority, so a strict
  dependency chain is safe — just make the order right via `priority`,
  don't rely on the queue to infer it).
- **Foundational/shared work first.** If three tickets all touch a
  component that doesn't exist yet, either fold creating it into the first
  ticket that needs it, or add a ticket for it at the top of the priority
  order.
- **Don't over-fragment either.** A ticket so small it's just "rename a
  variable" wastes a full refine+ship+review cycle on nothing. If in
  doubt, err toward the size of tickets already in the repo's `tickets/`
  history — read a few real examples (`done` or `review` ones) before
  guessing at granularity from scratch.
- **Aim for roughly 3-10 tickets** for a typical feature-sized idea. Fewer
  than that and you probably didn't decompose it; more than that and
  you're likely either over-fragmenting or the idea is bigger than "a
  feature" and deserves a conversation about scope before it becomes a
  backlog.

## Step 2: write each ticket in the exact scaffolded format

Every ticket is a markdown file in `<repo>/tickets/`, named as a kebab-case
slug of its title (e.g. `add-streak-badge-to-home-carousel.md` — no
numeric ID prefix, no date prefix). Match this frontmatter and structure
exactly (this is the same shape `ticket-queue-init` ships in
`_template.md` — don't invent a different one):

```markdown
---
title: "add streak badge to home carousel"
status: todo
priority: 3
created: 2026-01-15
---

## What

## Why

## Acceptance criteria
```

- `title`: short, imperative, lowercase-is-fine (matches the filename slug
  in spirit, doesn't need to be identical).
- `status`: always `todo` — you are queueing work, not doing it.
- `priority`: `1` (highest) to `5` (lowest). Use this to encode the
  decomposition's dependency order and importance — don't leave everything
  at the same priority, that defeats the point of sequencing.
- `created`: today's date, `YYYY-MM-DD`.
- **Leave `scope:` out.** The queue's refine phase fills that in by
  actually reading the codebase before implementation starts — writing a
  guessed `scope:` here just gets overwritten, and a wrong guess can bias
  the refine pass. The one exception: if you already know precisely which
  files should change (you read the code, not guessed), it's fine to save
  the refine phase a step — but don't fabricate a plausible-looking path
  you haven't actually verified exists.
- **Body:** `What` and `Why` should make the *intent* unambiguous even
  though implementation details aren't spelled out — a rough paragraph
  each is fine, the refine phase tightens it into concrete acceptance
  criteria before anything gets built. Still, don't leave `Acceptance
  criteria` totally empty if you have a clear idea of "done" — write what
  you know, leave it blank only where you genuinely don't have a strong
  opinion and want the refine phase to work it out.

## Step 3: confirm before writing, especially if the queue is live

Writing a new file into `tickets/` is a real trigger, not an inert draft —
if that repo's launchd ticket-queue job is loaded, adding files here kicks
off autonomous builds within moments (see `ticket-queue-init`'s own
WatchPaths behavior). Before writing multiple tickets in one pass:

- Show the user the full list of tickets you're about to create (title +
  one-line summary each + assigned priority), not just a count.
- If you have any way to tell whether the queue is currently loaded for
  this repo (a running `launchctl list | grep <label>`, or just ask), say
  so — "the queue is live, these will start building within moments" vs.
  "the queue isn't loaded, these will just sit in `todo` until you load it
  or run `automation/run-queue.sh` by hand."
- Get an explicit go-ahead before writing more than one or two tickets.
  Writing one ticket at a time as you go, narrating each, is also fine and
  often better than a silent batch — it lets the user redirect mid-plan.

## What this skill does not do

- Doesn't scaffold `tickets/`/`automation/` itself — that's
  `ticket-queue-init`, run once per repo before this skill is useful.
- Doesn't implement anything, doesn't touch app code, doesn't run `ship`
  directly — it only writes ticket files for the existing automation (or a
  human) to pick up.
- Doesn't fill in `scope:` with guesses — see Step 2.
- Doesn't decide the queue should be loaded/unloaded — that's the user's
  call, made once, separately, per `ticket-queue-init`'s own setup flow.
