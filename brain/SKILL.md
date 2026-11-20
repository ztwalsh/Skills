---
name: brain
description: Set up and keep a repo's `brain/` folder — product direction, principles, insights, and decisions with their reasons, filed by area of the product. Use when asked to "set up the brain", "add a brain folder", "log this decision", "log this insight", "record why we did that", "what did we decide about X", "review the brain", or when reorganizing an existing repo's product and design context. Other skills (brainstorm, ship, code-reviewer, ticket-planner) read `brain/` when it exists.
---

# Brain: a repo's memory of itself

`brain/` is where a project keeps what it knows: where it is going, how it decides, what it has
learned, and what was decided and why. It is committed with the code, so every session, machine
and collaborator reads the same thing. Chat history and an agent's private memory do not travel;
this does.

```
brain/
  README.md          how the folder works (read by people and agents)
  product.md         strategy and direction
  principles.md      the short list of rules that settle arguments
  insights.md        what users and the builder have learned, dated, newest first
  decisions/
    index.md         the list of areas, and the entry format
    product-wide.md  calls that apply everywhere; always read
    <area>.md        one file per area of the product, newest first
    brainstorms/     full histories written by the brainstorm skill
```

Templates for every file are in `templates/` beside this file. `templates/README.md` holds the
rules of the folder; read it before writing anything into a `brain/`.

Work out which of the three jobs below is being asked for. If the repo has no `brain/` and the
request is to log something, do **Set up** first and say so.

---

## The rules that apply to every job

1. **Quote the user exactly.** Their words go in a blockquote, typos included, never tidied or
   merged. Anything you add is labelled "Agent's reading:".
2. **Never invent a reason.** If nobody said why, ask once. If there is still no answer, write
   "No reason given."
3. **Never delete or rewrite history.** `insights.md` and the decision files are added to at the
   top. An entry that no longer holds gets its status changed and a pointer to what replaced it.
   `product.md` and `principles.md` are the exception: they describe the present and are edited
   in place.
4. **Use absolute dates** (`2026-11-15`), never "yesterday" or "last week".
5. **Keep personal details out.** No names, emails or private content from users. Refer to people
   by role.
6. **Do not commit or push** unless the user asks.

---

## Job 1: Set up

### In a new or empty repo

1. Copy `templates/` to `brain/` at the repo root. Rename nothing. Leave `decisions/_area.md` in
   place as the template for new areas.
2. Fill in what you can already answer from the conversation and the repo (a README, a product
   doc, the app itself). Leave a section empty rather than guess; an empty heading is honest, a
   plausible paragraph is not.
3. Propose the areas for `decisions/index.md` from the product's own navigation (its tabs,
   routes or top-level screens), and ask the user to confirm the list before creating the files.
   Three to eight areas is normal. Do not create an area file until there is a decision to put in it.
4. Add the pointer (see **The pointer** below).

### In a repo that already has context

Existing context is usually scattered: a `PRODUCT.md`, a `DESIGN.md`, tickets, a design-refs
folder, notes in `CLAUDE.md`, and your own memory of the project. Do not move anything yet.

1. **Survey.** List every file that holds product or design context, and read them.
2. **Propose a plan** to the user as a table: each source, where its content would go, and
   whether the source is moved, copied from, or left alone. Use these defaults:

   | Found | Goes to | Source file |
   |---|---|---|
   | `PRODUCT.md`, product sections of a README | `brain/product.md` | Moved (leave a one-line pointer if other tools read it) |
   | Stated rules, "always / never" lines in `CLAUDE.md`, `AGENTS.md` | `brain/principles.md` | Left in place; the principle is written fresh in `brain/` |
   | Notes about users, feedback, things learned | `brain/insights.md`, each dated | Left in place |
   | Reasons recorded in tickets, commit messages, design docs, past brainstorm histories | `brain/decisions/<area>.md` | Left in place, linked from the entry |
   | Your own memory notes about this project's direction or rules | The right `brain/` file | Kept; the repo copy becomes the source of truth |
   | `DESIGN.md` | **Stays at the root.** It says what the look is now; `decisions/` says why | Untouched |
   | `CLAUDE.md`, `AGENTS.md` | Stay at the root, plus the pointer | Edited only to add the pointer |

3. **Wait for approval.** Nothing is moved, rewritten or deleted until the user agrees to the plan.
4. **Carry it out.** When backfilling decisions from old material, each entry says where it came
   from, and each reason is either a real quote or marked "Reconstructed from <source>". Where
   the reason was never written down, write "No reason given." Do not smooth the gaps over.
5. **Report** what was created, what was moved, and the gaps: decisions whose reasons are missing
   and only the user can supply.

### The pointer

A `brain/` nobody reads is documentation. Make sure agents load it: add this to the repo's
`CLAUDE.md` (and `AGENTS.md` if it exists), creating `CLAUDE.md` if neither exists.

```markdown
## Project context
Before product or design work, read `brain/product.md`, `brain/principles.md`,
`brain/decisions/product-wide.md`, and the file in `brain/decisions/` for the area you are
working on (areas are listed in `brain/decisions/index.md`).

When the user makes a product or design decision (picks between options, sets or removes a
rule, chooses or drops a direction), log it with the `brain` skill **in the same turn, before
moving on**: their words quoted exactly, "No reason given." when they gave none. Then say in one
line what you logged and where, so they can see it went in. Do the same for anything learned
that belongs in `brain/insights.md`. Routine fixes and refactors are not decisions.
```

### The commit-time check

`hooks/post-commit-decisions.sh` asks the agent, after every commit in a repo with `brain/`,
whether the work included a decision that was not logged. It is set up once per machine, not per
repo; `install.md` has the steps. If it is not installed, mention it once during set up.

---

## Job 2: Log

Triggered by "log this", "record that", "note that we decided…", or by you noticing that a real
decision or insight just happened. In the second case, offer in one line and log only on a yes.

### An insight

Add to the top of `brain/insights.md`, under the `---`, using the format in that file. Set the
source honestly: `user said`, `builder noticed`, `data showed` or `agent noticed`.

### A decision

1. **Pick the area** from `brain/decisions/index.md`. If the decision applies everywhere, it goes
   in `product-wide.md` and nowhere else. If no area fits, propose a new one; on a yes, add the
   row to the index first and create the file from `_area.md`. Never create a near-duplicate of
   an existing area.
2. **Write the entry** at the top of that file (below "Where things stand"), in the format from
   `decisions/index.md`. One decision per entry.
3. **Ask for the reason if it is missing,** once, in one line. Then write what you have.
4. **Supersede, do not overwrite.** If this replaces an earlier decision, change that entry's
   status to `superseded by <date> · <title>` and leave the rest of it alone.
5. **Update "Where things stand"** at the top of the file so it lists only the calls that
   currently hold.
6. **Follow through.** If the decision changes how things look now, say that `DESIGN.md` needs
   the matching change (and make it if asked). If it sets a rule that will keep applying, offer
   to add it to `principles.md`.

### Promoting an insight to a principle

Only when the user agrees. Add the principle to `principles.md` with its cost ("Which means") and
its origin ("From"), and set the insight's status to `promoted to a principle`. Keep the list at
ten or fewer: adding an eleventh means merging or retiring one.

---

## Job 3: Review

Triggered by "review the brain", "is the brain up to date", or before a large piece of work.
Read the whole folder and report, without changing anything:

- **Stale:** `product.md` or `principles.md` with a "Last reviewed" date more than three months
  old, or that the code plainly contradicts.
- **Contradictions:** two standing decisions that disagree; a decision that breaks a principle;
  `DESIGN.md` describing something a decision removed.
- **Loose ends:** insights still `open` after a month; decisions with "No reason given." that
  the user could now fill in; areas in the index with no file, or files not in the index.
- **Missing:** decisions visible in recent commits or the conversation that were never logged.

Give the findings as a short list, most important first, each with the fix you would make. Make
the fixes the user approves.

---

## Answering "what did we decide about X"

Read `decisions/index.md`, then the area file and `product-wide.md`. Answer with the standing
decision, its date, and the reason in the user's words. If it was superseded, say what it
replaced. If there is no entry, say there is no record; do not answer from memory as if there were.
