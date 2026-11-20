---
name: logo
description: Explore, choose and finish a logo mark for a product or brand. Draws numbered marks in rounds (dozens at a time, as vector shapes in a grid), shows each one in real lockups with the wordmark, on app-icon tiles and at small sizes, lets the user pick by number and grows the next round from the picks, can try typefaces from Google Fonts for the wordmark, and ends with a summary page whose artwork downloads as SVG, PNG or JPG in light and dark. Records every pick and its reason in the user's words. Use when asked to "design a logo", "explore logo marks", "jam on the logo", "give me 100 logo options", "try other fonts for the wordmark", "another round from 017 and 042", or "finalize the logo". Sets up a portable `logo/` folder on first use in any repo.
---

# Logo

Draw many marks, judge them in use, let the user pick by number, grow the next round only from
the picks, and finish with one mark, its rules and its artwork. Keep a record of every choice.

This is a sibling of the `brainstorm` skill, not a use of it. A brainstorm is a handful of built
prototypes per pass. A logo round is dozens of small vector drawings in one grid, judged beside
a wordmark, with a defined finish line.

## Words

| Word | Means |
|---|---|
| **Mark** | One drawing. Its ID is `r<round>-<number>`, e.g. `r2-017`, and is permanent. |
| **Round** | One full set of marks. Rounds are only added, never replaced. |
| **Family** | About ten marks in a round that push one idea. |
| **Wordmark** | The name set in type: supplied by the user as artwork, or a typeface being explored. |
| **Lockup** | Mark and wordmark together: inline (mark between two words), mark first, stacked. |
| **Viewer** | The pages in `logo/` for browsing rounds and the final summary. Identical in every repo. |

## What gets written where

```
logo/
  index.html, viewer-tokens.css, DESIGN.md, viewer/, data.js    the viewer
  logo.json                                                      the source of truth
  wordmark/                                                      supplied artwork, as received
  rounds/round-1.mjs, round-2.mjs, …                             the marks
brain/decisions/brainstorms/<date>-logo-<name>.md                the readable history (generated)
brain/decisions/brand.md                                         a short entry when the mark is chosen
```

`logo/` sits at the project root, beside `playground/` if there is one. The owner may move,
rename or delete it; nothing else depends on it. Without a `brain/` folder the history is
written to `logo/HISTORY.md`.

Read before writing anything:
- `reference/data.md`: the file formats and the rules for the decision log.
- `reference/marks.md`: how to draw a round.
- `reference/type.md`: the wordmark, typefaces and outlining.

The viewer follows `logo/DESIGN.md` and `logo/viewer-tokens.css`. The marks follow the brand.
Never mix the two.

---

## Step 0: Orient

1. Read the project's context, whichever exist: `brain/product.md`, `brain/principles.md`,
   `brain/decisions/product-wide.md`, `brain/decisions/brand.md`, and `DESIGN.md`. Standing
   decisions about colour, type and tone are constraints on the marks.
2. Decide which situation this is:

   | Situation | Do |
   |---|---|
   | No `logo/` yet | Step 1, Step 2, then a round |
   | Picks or feedback on a round | **Recording picks**, then **The next round** |
   | "Try other fonts" | **Exploring type** |
   | A small change to one mark | **Refining a mark** |
   | The user names the winner | **Finishing** |

## Step 1: Collect what only the user has

Ask for these before drawing. Ask once, together, and do not start a round without the first two.

1. **The name, exactly as it should read,** and whether it splits into two words the mark could
   sit between ("move" + "think") or is one word.
2. **The wordmark.** Always ask: "Do you have the wordmark as artwork (SVG), or should we explore
   typefaces?" Supplied artwork is never redrawn, re-spaced or re-outlined. If they have none,
   or want to compare, typefaces come from Google Fonts (see **Exploring type**). Both can
   coexist.
3. **The two brand colours** (ink and paper), if `DESIGN.md` or `brain/` does not already give them.
4. **An existing mark,** if there is one. It becomes mark 001 of round 1, exactly as drawn.
5. **References and dislikes:** marks they admire, and anything to stay away from.
6. **How many marks** for the first round. Default 60 in six families; 100 if they ask for breadth.

Record their brief word for word.

## Step 2: Set up `logo/`

The viewer template is in `viewer/` beside this file, with `DESIGN.md`.

- **No `logo/` yet:** create it and copy `viewer/index.html` → `logo/index.html`,
  `viewer/viewer-tokens.css` → `logo/viewer-tokens.css`, `DESIGN.md` → `logo/DESIGN.md`, and
  `viewer/logo.css`, `logo.js`, `sync.mjs`, `outline.mjs`, `geo.mjs`, `VERSION` and the `vendor/`
  folder → `logo/viewer/`.
- **`logo/` exists with this viewer:** if the skill's `VERSION` is newer, replace `index.html`
  and the files in `logo/viewer/`. Never overwrite `logo/viewer-tokens.css` or `logo/DESIGN.md`.
- **A `logo/` folder exists with something else in it:** do not touch it. Ask where to put the
  project instead.
- Save supplied artwork untouched in `logo/wordmark/`. Fill `wordmark.supplied` in `logo.json`
  as `reference/type.md` describes.
- Write `logo.json`: name, colours, wordmark, the brief, `status: "open"`, and the first log
  entry (`type: "brief"`, the user's words).
- Keep it off the public site: check how the project builds. If `logo/` would be published,
  exclude it or say plainly that it will be public. `index.html` asks search engines not to index it.

The viewer needs no dependencies. Do not add any to the host project.

## Step 3: Draw a round

Follow `reference/marks.md`. In short:

1. **Plan the families first.** For round 1, range widely: start beside any existing mark and
   travel outward through what the product is and does. Write each family's one-line idea before
   drawing anything. For later rounds, see **The next round**.
2. **Draw** each mark as SVG in the 140-unit box, one colour, one idea per mark, in
   `logo/rounds/round-N.mjs`. Design work runs on Opus: if you hand the drawing to a subagent,
   give it the families, the references, the wordmark and `reference/marks.md`, and set its model.
3. **Sync:** `node logo/viewer/sync.mjs`. Fix every error.
4. **Look at every mark** in the viewer at desktop width, in the grid and in the lockup, light
   and dark. Replace the weak ones (clichés, near-duplicates, marks that fall apart at 24px,
   marks that fight the wordmark) and look again. Do at least two passes.
5. **Add the round** to `logo.json` (`n`, date, `brief`, `from`, a one-line `summary`) and a
   `recommend` log entry with your shortlist and why. Sync again.
6. **Report:** the families and their ideas, your shortlist (marked as yours), the weakest you
   left in, and how to view it (`logo/index.html` opens straight from the file). Ask which
   numbers to take forward; ticking marks in the viewer and pressing Copy gives them the list.

Do not commit or push unless asked.

## Recording picks

Write picks down **in the same turn, before doing anything else.**

1. Add `chosen`, `dropped` or `feedback` entries to the log with the user's words exactly.
2. If they picked without saying why, ask once: "One line on why those, for the record?" Carry
   on either way. No reason means an empty quote and `"note": "No reason given."`
3. Update `picks`. Sync.

A logo's history is hard to rebuild afterwards: picks are often a list of numbers and nothing
else. The reason is the part worth catching.

## The next round

1. **Grow only from the picks.** List the vocabulary the chosen marks contain (their shapes,
   angle, weight, the move each one makes) and stay inside it. Push each pick alone, then cross
   them in pairs. New ideas from outside belong in a separate, clearly named family, and only
   when the user asked for them.
2. If the feedback is a new idea rather than picks ("I want it to feel like thoughts coming
   into focus"), the round starts from that idea: `from` is empty and the log says so.
3. Every mark lists its `parents`, on the family or the mark.
4. A later round can be smaller: 40 marks on one idea is normal.
5. Then Step 3, from "Draw".

## Exploring type

When there is no supplied wordmark, or the user wants to compare, follow `reference/type.md`:
propose eight to twelve Google Fonts that suit the brand, add them to `wordmark.fonts`, sync,
and tell the user the candidates are in the viewer's preview panel: select any mark in any
round and switch the wordmark there to see it in every lockup. A typeface choice is a decision: log it as a `note` entry with their words, and set
`wordmark.active`. Supplied artwork always stays available as "Supplied".

## Refining a mark

For a small change to a mark the user has picked (ease a corner, close a gap, fix a seam):
edit it in its round file, add a `feedback` entry with their words if they asked for it, then a
`refined` entry saying what changed. This is the one case where a mark already shown is edited.
A change big enough to be a different drawing is a new mark in a new round.

## Finishing

When the user names the winner:

1. Log `final` with their words. Set `picks`, `status: "decided"`.
2. **Test the mark before calling it done:**
   - At 16, 24 and 32px. If detail vanishes, draw a **small cut** (the same idea with fewer,
     larger parts) and set the size where it takes over.
   - On the app-icon tile, dark and light.
   - In every lockup, with the active wordmark.
   - For seams: shapes that touch should be one path, or thin lines show on some screens.
   - In one flat colour both ways round. No tints, no outline, no gradient.
3. **The wordmark must be outlines** before artwork can be exported. Supplied artwork already
   is. A typeface is outlined with `node logo/viewer/outline.mjs` (`reference/type.md`).
4. **Write the outcome** in `logo.json`: `headline` (the idea in one line), `idea` (two or three
   sentences on what the mark means and how it is built), optional `reads`, `minSize`, and the
   `smallCut`. Sync.
5. **Check the summary page** (`logo/index.html`, "The mark"): the idea, the lockups, the app
   icon, the sizes, the colours, and the Artwork section. Download one SVG, one PNG and one JPG,
   light and dark, and open them to confirm they are right.
6. **If the repo has `brain/`:** add an entry to `brain/decisions/brand.md` (add the area to the
   index if it is new): the mark, the reason in the user's words, what was ruled out, and a link
   to the generated history. Suggest any principle the work surfaced; write it only on a yes.
7. Tell the user where the summary page is and that every asset downloads from it as SVG, PNG
   or JPG, light or dark, or all at once.

Putting the mark into the product (favicon, app icon, site header) is separate work. Offer it.

---

## Before reporting, every time

- [ ] The wordmark supplied by the user is untouched
- [ ] Every mark is one colour, one idea, numbered, named, and in a family with a one-line idea
- [ ] No clichés the user ruled out, and none of the stock ones in `reference/marks.md`
- [ ] Rounds after the first grow from the picks, and every mark lists its parents
- [ ] You looked at the whole round in the viewer, in lockups, light and dark
- [ ] Every user quote in the log is word for word; every pick has a reason or "No reason given."
- [ ] `node logo/viewer/sync.mjs` ends with 0 errors
