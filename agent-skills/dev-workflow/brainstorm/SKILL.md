---
name: brainstorm
description: Brainstorm a design or product problem as numbered ideas in a repo's `playground/`, built in the project's own stack, each with a square Stageshow illustration, and browsed through one standard shell (index, passes, idea detail). Records every pick and its reason, in the user's words, so the lineage of the final idea is kept. Use when asked to "brainstorm", "explore options for", "give me some directions for", "jam on" a screen, flow, component, mark or concept, or to take chosen ideas further in another pass. Sets the playground up on first use in any repo.
---

# Brainstorm

Turn a problem into a set of distinct ideas, let the user pick, grow the picks into the next
set, and keep a record of every choice and why it was made.

The user's input is in `args`. Split it on ` -- ` (space, two dashes, space): the part before
is the **problem**, the part after is **extra criteria** for the checker. If `args` is empty and
the conversation does not make the problem clear, ask what to brainstorm.

## Words

| Word | Means |
|---|---|
| **Brainstorm** | One problem, e.g. "a new analytics page". One folder in `playground/`. |
| **Pass** | One round of the user's direction. Pass 1 answers the brief. "Those are great, but do x and y" starts pass 2. Passes are only added, never replaced. |
| **Idea** | One distinct answer. Its ID is `p<pass>-<number>`, e.g. `p2-017`, and is permanent. |
| **Check** | The automatic review-and-revise loop inside a pass. Not visible in the structure. |
| **Shell** | The playground's own navigation UI. Identical in every repo. |

## Two design sources, never mixed

- **The shell** (index, tables, grids, idea panel) follows `playground/DESIGN.md` and
  `playground/tokens.css`. It comes from this skill and is the same everywhere.
- **The ideas** follow the host project: its `DESIGN.md`, its tokens, its components, its stack.

An idea never uses the shell's tokens. The shell never borrows the project's look.

## What gets written where

```
playground/
  index.html, tokens.css, DESIGN.md, shell/, data.js      the shell
  <brainstorm-slug>/
    brainstorm.json                                        the source of truth
    pass-1/
      idea-001-<name>/   thumb.png, illustration/, and the idea when the stack allows
      idea-002-<name>/
    pass-2/ ...
brain/decisions/brainstorms/<date>-<slug>.md               the readable history (generated)
brain/decisions/<area>.md                                  a short entry when a decision lands
```

If the repo has no `brain/` folder, the history is written to
`playground/<slug>/HISTORY.md` instead and nothing is written outside `playground/`.

The metadata format and the rules for the decision log are in `reference/metadata.md`.
**Read it before writing any `brainstorm.json`.**

---

## Step 0: Orient

1. **Find the project.** Normally the repo root. If the repo holds several self-contained
   sub-projects, each with its own `DESIGN.md`, work inside the one the problem belongs to and
   put `playground/` there. Never blend context across sub-projects.
2. **Read the project's context,** whichever of these exist:
   - `brain/product.md`, `brain/principles.md`, `brain/decisions/product-wide.md`, and the
     `brain/decisions/<area>.md` for the area this problem is in (areas are listed in
     `brain/decisions/index.md`). Standing decisions are constraints: an idea that breaks one is
     not a valid idea, unless the user asked to revisit that decision.
   - `DESIGN.md` and the real token source (CSS custom properties, a theme file, a Swift tokens file).
   - `PRODUCT.md` or `PROMPT.md` when there is no `brain/`.
3. **Decide which situation this is:**

   | Situation | Do |
   |---|---|
   | A new problem | Step 1, then Step 2 |
   | Feedback or picks on an existing brainstorm | **Recording picks**, then **The next pass** |
   | A small change to one idea ("make 3 lighter") | **Refining one idea** |
   | The user names the winner | **Finishing** |

   If it is unclear whether the user wants a new brainstorm or another pass on an open one, ask.

## Step 1: Set up the playground (first use in a repo, or an upgrade)

The shell template is in `shell/` beside this file, with `DESIGN.md`.

- **No `playground/` yet:** create it and copy in
  `shell/index.html` → `playground/index.html`,
  `shell/tokens.css` → `playground/tokens.css`,
  `DESIGN.md` → `playground/DESIGN.md`,
  and `shell/shell.css`, `shell/shell.js`, `shell/sync.mjs`, `shell/VERSION` → `playground/shell/`.
- **`playground/` exists with this shell:** compare `playground/shell/VERSION` with the skill's.
  If the skill's is newer, replace `index.html` and the files in `playground/shell/`.
  **Never overwrite `playground/tokens.css` or `playground/DESIGN.md`:** they are the owner's to
  customize. If the new shell needs a token the file lacks, add that token and say so.
- **`playground/` exists with something else in it** (an older, hand-built playground): do not
  delete or restructure it. Tell the user what is there and ask whether to set the shell up
  beside it or migrate the old ideas in.
- **Keep it off the public site.** Check how the project builds and deploys. If `playground/`
  would be published, exclude it from the build or say plainly that it will be public.
  `index.html` already asks search engines not to index it.

Do not add dependencies to the host project for the shell. It needs none.

## Step 2: Start the brainstorm

1. Pick a short kebab-case slug (`analytics-page`). If it exists, this is a new pass, not a new
   brainstorm.
2. Create `playground/<slug>/brainstorm.json` with the title, a one-line description, the area,
   `status: "open"`, today's date, and the **brief: the user's ask, word for word**.
3. Add the first log entry: `type: "brief"`, `by: "user"`, the same quote.

## Step 3: Generate the ideas

Make **3 to 5 ideas** for a pass unless the user asks for a different number. They must be
different bets (a different interaction model, structure or density), not variations of one.
In pass 2 and later, every idea names the chosen ideas it grew from in `parents`.

Number them `p<pass>-001` upward. Each gets a folder `pass-<n>/idea-<number>-<kebab-name>/`.

**Build each idea in the project's own stack:**

- Use the project's real tokens and components. Never hardcode a value that duplicates a token,
  and never fork a copy of the token block.
- Put the idea's code where the stack can run it. If files can run from anywhere (plain HTML),
  keep it in the idea's folder. If the stack needs a route, a preview or a target (React, Next,
  SwiftUI), put it where that stack expects, under a clearly named playground location, and
  record the path in the idea's `source`. Follow the project's existing conventions; do not
  introduce a new library or pattern.
- Set `url` when the idea can be opened in a browser through the project's dev server.
- Focus on the moment being explored, not the whole screen. Keep it short.
- The key interaction works on click or tap, not hover only.
- Start the file with a comment: the idea's ID, name, and its bet in one or two sentences.
- No real user data, names or private content. Invent it.

Write each idea's entry in `brainstorm.json` (`name`, `bet`, `dir`, `source`, `url`, `parents`,
`status: "open"`) as it is built.

## Step 4: Check

Spawn one fresh subagent on Opus with the brief in `reference/evaluator.md`. Then:

- Revise each idea that did not pass, with targeted edits, following its `revise` note.
- If two ideas are flagged as too similar, replace the weaker one with a different bet. It keeps
  its number; add a `refined` log entry saying what was replaced and why.
- Run the check again. Stop when every idea passes or after **three checks**.
- Store the final `score` and `note` in each idea's `eval`.

Checks are not passes. Do not create a new pass for a revision the checker asked for.

## Step 5: Illustrate

Make one square illustration per idea with the Stageshow skill, following
`reference/illustrations.md`. Save it as `thumb.png` in the idea's folder and set `thumb`.
Illustrate after the check, so the picture shows the idea as it ended up.

## Step 6: Record, sync, report

1. Add a `recommend` log entry (`by: "agent"`): the ideas you would take forward and why, in
   `note`. Give the pass a one-line `summary`.
2. Run `node playground/shell/sync.mjs`. Fix every error it reports and look at each warning.
3. Open the playground and look at the pass in both grid and list view before reporting.
4. Report to the user:
   - Each idea: ID, name, its bet in one line.
   - Your recommendation and the reason, clearly marked as yours.
   - How to view it: open `playground/index.html` (it works straight from the file), and which
     command starts the project's dev server for the "Open idea" links.
   - What was not done or not verified (illustrations skipped, ideas with no live view).
   - Then ask which ideas to take forward. They can answer with IDs; the playground's
     "Copy" button on a selection gives them the list to paste.

Do not commit or push unless asked.

---

## Recording picks

When the user picks, drops or comments on ideas, write it down **in the same turn, before doing
anything else.** This is the part of the skill that matters most; a brainstorm whose reasons
were never written down cannot be reconstructed later.

1. Add log entries following `reference/metadata.md`: `chosen`, `dropped` or `feedback`, with
   the user's words **exactly as written** in `quote`.
2. If they picked without saying why, ask once, in one line: "One line on why those, for the
   record?" Carry on with the work either way. If no reason comes, the entry gets an empty quote
   and `"note": "No reason given."`
3. Set each idea's `status` to match.
4. Keep your own reading out of `quote`. If it helps to add context, put it in `note`.
5. Run sync.

## The next pass

1. Add the pass to `brainstorm.json`: `n`, today's date, `brief` (the feedback that started it,
   word for word), and `from` (the chosen idea IDs it grows from).
2. Run Steps 3 to 6 for the new pass. Every new idea lists its `parents`.
3. Ideas from earlier passes are never edited, renumbered or removed. They are the record.

## Refining one idea

For a small change to an existing idea ("make p2-003 lighter"):

1. Edit the idea in place.
2. Add a `feedback` log entry with the user's words, then a `refined` entry (`by: "agent"`,
   `note`: what changed).
3. Re-make its illustration if the change is visible in it. Run sync.
4. Do not run the check again unless asked.

A change large enough to be a different bet is a new idea in a new pass, not a refinement.

## Finishing

When the user names the winner:

1. Add a `final` log entry with their words. Set that idea's `status` to `final`, the
   brainstorm's `status` to `decided`, and fill `outcome` (`idea`, `date`, and a `summary` of
   what was chosen, in the agent's wording). Run sync.
2. **If the repo has `brain/`:**
   - Add a short dated entry at the top of `brain/decisions/<area>.md`, in the format from
     `brain/decisions/index.md`: the decision, the reason in the user's words, what was ruled
     out, and a link to the generated history in `brain/decisions/brainstorms/`. Update that
     file's "Where things stand". If the area has no file yet, add it to the index first.
   - Suggest, in one line each, any insight or principle the brainstorm surfaced. Write them
     into `brain/insights.md` or `brain/principles.md` only if the user agrees.
3. If the outcome changes how the product looks now, say that the project's `DESIGN.md` needs
   the matching change, and make it if asked.
4. Building the chosen idea for real is separate work. Offer it; do not start it unasked.

To shelve a brainstorm without a winner, set `status: "archived"` and add a `note` entry saying why.

---

## Before reporting, every time

- [ ] Ideas use the project's tokens and components; the shell's tokens appear in no idea
- [ ] No idea breaks a standing decision in `brain/decisions/`
- [ ] Every idea has an ID, a name, a one-line bet, and, after pass 1, its parents
- [ ] The key interaction of every idea works on click or tap
- [ ] Every user quote in the log is word for word; nothing of yours is in a `quote`
- [ ] Every pick has a reason or "No reason given."
- [ ] `node playground/shell/sync.mjs` ends with 0 errors
- [ ] You looked at the pass in the playground, in grid and list view
- [ ] No real user data anywhere
