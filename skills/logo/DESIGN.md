# Logo viewer design

This guide covers only the viewer: the pages around the logo work (the rounds and the summary
page). It never governs the marks themselves. The marks are drawn in the
project's own two colours, from `logo.json`.

## The one rule

**Every screen is a title, one small line, a toolbar, and the work.** The rounds pages are the
title, "45 marks · Grew from r3-001, r3-025", the preview toggle and the grid. Anything longer,
such as the brief, the reasons or the history, lives in `HISTORY.md` or the brain, not on screen.

## The look in six rules

1. **Two colours for the chrome.** Near-black `#131312` and cream `#FAF8F5`, with everything
   else mixed from them with `color-mix`. There is no accent, no gradient and no shadow; the only
   edges are the panel's hairline and the hairline tiles. The logo's own ink and paper appear
   only on artwork: app icon tiles, colour swatches, artwork previews and exports.
2. **Hairlines do the structure.** Grid columns are 1px rules running the full height. Tiles
   are 1px inset outlines with rounded corners.
3. **Quiet type.** Geist 400 and 500 only, falling back to the system sans when offline. Labels
   are 12px, medium weight and muted. Numbers are tabular. Everything is in sentence case.
4. **Sparse.** A page shows its title, one line of context, its controls and its content.
   Nothing explains itself twice.
5. **Status is a chip, nothing else.** Chosen gets an outlined chip, final a solid one, dropped
   a quieter outline. Nothing is ever dimmed.
6. **Soft, short motion.** Only position and opacity move, over 140 to 520ms: the grid's
   entrance, the gliding number chip, the mark swap in the panel, and the hero's shapes arriving
   from left to right. Everything is instant under `prefers-reduced-motion`.

Dark is the default theme. The round button in the top bar, or the D key, swaps ink and paper.

## Tokens (`viewer-tokens.css`)

| Token | Default | Used for |
|---|---|---|
| `--black`, `--cream` | `#131312`, `#FAF8F5` | The chrome's two colours |
| `--ink`, `--paper` | cream, black (dark theme) | Foreground and ground; swapped in light |
| `--ink-2`, `--ink-3` | 64%, 46% ink on paper | Secondary text, quiet labels |
| `--rule`, `--rule-strong` | 16%, 34% ink | Hairlines; hover and checkbox edges |
| `--tint`, `--tint-2` | 4%, 8% ink | Hover ground; selected ground |
| `--scrim` | 48% black | Behind the bottom sheet |
| `--font`, `--font-mono` | Geist, Geist Mono, system fallbacks | Text; file names |
| `--fs-label` … `--fs-hero` | 12, 13, 15, 17, 28px … clamp(32–52px) | Type scale |
| `--r-chip`, `--r-sm`, `--r-md`, `--r-sheet`, `--r-pill` | 4, 8, 12, 16px, pill | Radii |
| `--s-1` … `--s-8` | 4 … 72px | Spacing |
| `--gutter`, `--max`, `--max-text` | 48px, 1440px, 1040px | Page sides, round pages, summary column |
| `--control-h` | 34px | Pills, selects, icon buttons |
| `--cell-min` | 160px | A grid column is at least this wide (2 to 8 columns) |
| `--head-lockup` | 220px | The lockup in the top bar |
| `--t-fast`, `--t-base`, `--t-in`, `--t-out` | 160, 220, 280, 200ms | Durations |
| `--ease-out`, `--ease-in` | cubic-beziers | Enter and leave curves |

## Pages and components

- **Top bar:** on the left, the project's lockup with its lead mark (the final mark, else the
  latest chosen, else r1-001), which links home. On the right, the page switcher pill (The mark,
  Round N … Round 1) and the theme button.
- **Round page:** the title "Round 4", then one line with the count and "Grew from" links. On
  the right, the preview toggle pill shows the selected number. Below is the grid: family cells
  inline (number range, name, one-line note) and mark cells (mark, number, name).
  - **Selecting:** focusing a cell selects it; clicking also opens the panel. The selected
    number becomes a solid chip that glides from the old cell to the new one.
  - **Keyboard:** the arrow keys move through the grid by its current column count, X adds the
    mark to the shortlist, and Esc closes the panel.
  - **Status:** a status chip sits in the cell's top-right corner, and a checkbox sits top-left.
    The checkbox shows on hover or focus, always on touch screens, and on every cell once
    anything is shortlisted.
- **Panel:** fixed on the right, `33vw` by default, between 320px and `60vw`. Drag its edge to
  resize it, double-click the edge to reset it, or use the keyboard on the edge: left and right
  arrows, Home, End, and Enter to reset.
  - **Head:** the number and name, then previous, next and close.
  - **Body:**
    - the Wordmark section, first, when there is more than one option
    - the status chip with "Grew from" and "Led to" links (a long "Led to" list collapses to
      six links and "and 44 more")
    - Inline (two-word names only), Mark first and Stacked lockup tiles
    - app icon tiles in the project's ink and paper at 120, 60 and 29
    - the mark at 16–128 and the inline lockup at heights 16–64
  - **Stepping:** moving to another mark swaps it in place. The old mark leaves up and right, the
    new one arrives from below.
  - **Narrow screens:** below 900px the panel becomes a bottom sheet over a scrim.
- **Wordmark section:** the one place to choose type, on every round. It is a single-choice row of
  pills: "Supplied" first, then each font by family and weight. A font not yet outlined carries
  a quiet "live" tag.
  - **Recorded choice:** the project's `wordmark.active` has a small dot, with a "recorded" key
    beside the label, because the viewer's pick can differ from it.
  - **Choosing:** the pick redraws every lockup in the viewer and is remembered; the default is
    `wordmark.active`. Arrow keys move and pick, and Home and End jump to the ends.
  - **Size:** the row wraps, and past two rows it scrolls inside itself, keeping the pick in
    view. With a dozen fonts the lockups still start high on a 900px window.
  - **Copy:** a quiet "Copy" beside the label copies e.g. `r4-029 with fraunces-400` for the
    agent.
  - **One option:** the section is hidden when there is only one wordmark.
  - **Fonts:** a font with an `outline` (made by `viewer/outline.mjs`) is drawn from those paths,
    exactly like supplied artwork, and is never fetched. A font without one is live text, loaded
    from Google Fonts when first needed. Until it arrives, or if it can't load, its lockups show
    the family name in the system font with "loading font" or "font not loaded". Each wordmark's
    mark box follows its own x-height.
- **Summary page** (when the project is decided), in this order:
  - a hero mark whose shapes arrive left to right, beside the headline and the idea
  - How it reads
  - With the wordmark (inline, reversed, mark first, stacked)
  - App icon (the small cut below its size limit)
  - Sizes (the full mark down to `minSize`, the small cut below)
  - Colour
  - Artwork
- **Artwork:** a Light / Dark switch, "Download all", and one row per asset (mark, small cut,
  inline, mark first and stacked lockups, app icon) with SVG, PNG, JPG and Copy SVG.
  - **Colours:** light is ink on paper, and dark is paper on ink. SVG and PNG are transparent,
    except the app icon, which carries its tile. JPG has the solid ground.
  - **Sizes and names:** PNG and JPG are 2048 on the longest side, or 1024 for the icon. Files are
    named like `movethink-lockup-inline-dark.png`. Download all saves one zip of every asset,
    format and mode.
  - **Wordmark in use:** a line names the wordmark being exported ("Wordmark: Fraunces Regular",
    the outlined font's full name) with the same pill row beneath it, so nobody exports the wrong
    typeface unseen. Exports use the viewer's pick (by default `wordmark.active`). Lockups export as pure paths from the supplied artwork or a font's
    outline. When the wordmark in use is live text with no outline, lockup rows keep their
    preview and show "Outline the wordmark to export lockups: `node logo/viewer/outline.mjs`".
- **Shortlist bar:** a floating pill showing "3 selected", Copy and Clear. Copy gives a plain
  list such as `r1-017, r1-020`. Nothing is saved.

## Lockup geometry

Every lockup is built from the wordmark's x-height, `xh = baseline − xTop`:

- **Mark box:** `1.707 × xh` on a side, centred on the middle of the x-height.
- **Inline:** word one, a gap of `0.207 × xh`, the box, the same gap, then word two. Word two is
  translated, never redrawn.
- **Mark first:** the box at 0.8 scale, centred on ascender-to-baseline, `0.418 × xh` before the
  word's ink.
- **Stacked:** the box at 1.7 scale, centred over the word, `0.415 × xh` above the ascenders.

With movethink's supplied artwork this reproduces the hand-set board to within 0.6 units.

## Customizing

1. **Edit `viewer-tokens.css` first.** The chrome's two colours, the font, radii, spacing, the
   grid's column minimum and the header lockup's width are all there. Keep everything else
   derived from `--ink` and `--paper` so both themes stay in step. The logo's own colours belong
   in `logo.json`, not here.
2. If a component's shape has to change, edit `viewer/logo.css`. Use tokens only, keep motion to
   position and opacity, and keep the reduced-motion block. A skill update replaces everything
   in `viewer/` and `index.html`, so note the change here so it can be carried forward.
3. `viewer-tokens.css` and this guide are yours; updates leave them alone. Narrow screens
   override `--gutter` and `--head-lockup` in `logo.css`, so change those breakpoint values
   there.
