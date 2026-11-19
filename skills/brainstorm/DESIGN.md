# Playground shell design

This guide covers only the shell: the index, the tables, the grids and the idea panel. It never
governs the ideas themselves. Each idea follows its own project's DESIGN.md.

## The one rule

**Every screen is a title, one small line, one toolbar, one list.** The index set the pattern, and
the brainstorm and pass pages follow it exactly: the same distance from title to meta line, to
toolbar, to table or grid. Anything else (history, the full bet, lineage beyond one link) waits
behind a click.

## The look in six rules

1. **Two colours.** Near-black `#131312` and cream `#FAF8F5`. Every grey, rule and tint is mixed
   from those two with `color-mix`. No accent colour, no gradients, no shadows. The only edge
   is the panel's hairline.
2. **Hairlines do the structure.** Grids, tables and sections are separated by 1px rules at 16%
   ink, never by boxes or fills.
3. **Quiet type.** Geist 400 and 500 only (system sans when offline). Labels are 12px, medium
   weight, muted. Numbers are tabular. Sentence case everywhere.
4. **Sparse.** Few elements and little copy. A page shows its title, one line of context, its
   controls and its content. Nothing explains itself twice.
5. **Status is a chip, nothing else.** Chosen gets an ink-outlined chip and final a solid chip.
   Dropped ideas and archived brainstorms get a quieter outlined chip. Every row and tile is
   drawn at full strength whatever its status: nothing is faded, so a dropped idea looks like
   any other except for its label.
6. **Soft, short motion.** Only position and opacity move, over 160 to 280ms. Everything is
   instant under `prefers-reduced-motion`.

Dark is the default theme. The toggle swaps ink and paper.

## Tokens (`shell-tokens.css`)

| Token | Default | Used for |
|---|---|---|
| `--black`, `--cream` | `#131312`, `#FAF8F5` | The two base colours |
| `--ink`, `--paper` | cream, black (dark theme) | Foreground and ground; swapped in light |
| `--ink-2`, `--ink-3` | 64%, 46% ink on paper | Secondary text, quiet labels |
| `--rule`, `--rule-strong` | 16%, 34% ink | Hairlines; hover and checkbox edges |
| `--tint`, `--tint-2` | 4%, 8% ink | Hover ground; selected or open ground |
| `--scrim` | 48% black | Behind the bottom sheet |
| `--font`, `--font-mono` | Geist, Geist Mono, system fallbacks | Text; the source path |
| `--fs-label` … `--fs-title` | 12, 13, 15, 19px … clamp(28–40px) | Type scale |
| `--r-chip`, `--r-sm`, `--r-md`, `--r-sheet`, `--r-pill` | 4, 8, 12, 16px, pill | Radii |
| `--s-1` … `--s-8` | 4 … 72px | Spacing |
| `--gutter`, `--max` | 48px, 1360px | Page sides and width; gutter drops to 24px, then 16px |
| `--panel` | 460px | Side panel width |
| `--control-h` | 34px | Pills, inputs, icon buttons |
| `--tile-min` | 200px (150px on phones) | Smallest grid card |
| `--t-fast`, `--t-base`, `--t-in`, `--t-out` | 160, 220, 280, 200ms | Durations |
| `--ease-out`, `--ease-in` | cubic-beziers | Enter and leave curves |

`shell.css` uses only these tokens for colour, type, radius and motion.

## Components

- **Top bar:** breadcrumbs on the left (Home / brainstorm / Pass n) and a round theme button on
  the right.
- **Page head:** a large title and one small muted line, nothing else. The index line reads
  "5 brainstorms". The brainstorm line reads "3 passes" plus a Decided or Archived chip. The
  pass line reads "4 ideas · 1 chosen · Grew from p2-001", with the IDs as links. There are no
  descriptions, briefs, feedback quotes, summaries or outcome blocks above the list. The
  outcome is still findable: the final idea carries its Final chip in its pass.
- **Toolbar:** one row right under the head. Index: search and the date range pill. Brainstorm: a
  "History" pill. Pass: search and "Chosen only". All three end with the List/Grid switch on the
  right. The switch is remembered; nothing else is.
- **Date range:** one pill with a calendar icon. It reads "Any date", or when set "5 Aug – 25 Oct
  2026", with a small × inside to clear. It opens a dialog under the pill: presets (Last 7 days,
  Last 30 days, Last 3 months, This year, Any date) beside one month with previous and next
  buttons. Click a day to start the range and another to end it; the earlier day always becomes
  the start, and the same day twice is a one-day range. The range ends are solid ink chips, the
  days between sit on the 8% tint, and today has a thin outline. A preset or a finished range
  filters right away and closes the dialog, as do Esc and an outside click. Keyboard: arrows move
  a day or a week, Home and End go to the week's ends, PageUp and PageDown change the month
  (with Shift, the year), Enter or Space picks, Tab cycles inside the dialog, and Esc returns
  focus to the pill. The week starts on the browser locale's first day (Monday if unknown).
  Month and weekday names come from Intl in en-GB, like the shell's dates. On phones the dialog
  is a bottom sheet over a scrim, with the presets as a wrapping row of pills above the month.
  It filters on last modified, including both ends, using plain YYYY-MM-DD strings so time
  zones can't shift a day.
- **Grid:** square cards in a ruled grid. Each card has a thumbnail, then its text. A pass card
  shows only "Pass 2", its date and "4 ideas, 1 chosen". Idea cells
  show the number in medium weight, the name muted and a status chip. A checkbox sits on the
  thumbnail's corner. It shows on hover or focus, always on touch screens, and on every card
  once anything is selected. When an idea has a live view, a small round expand button sits on
  the opposite corner. It shows only on hover or focus and is hidden on touch screens, where the
  panel's "Open idea" is the way in.
- **Placeholder tile:** shown when an idea has no thumbnail, or its thumbnail fails to load. The
  number is large and the name small, on a 4% tint. There is never a broken image.
- **Table:** small muted column heads, hairline rows (47px, the same on every page) and tabular
  numbers. A whole row opens on click. Long text gets one line with an ellipsis, and the full
  text is in the title attribute (passes: "Started from") or the panel (ideas: "Bet"). The pass
  table's Eval column appears only when some idea in the pass has an eval. Idea rows end with
  a small outlined "View" link. Under 900px the long-text column drops out, and on phones
  dates, Eval and View drop out too.
- **Quote:** the user's words, verbatim, with a 1px ink rule on the left and typographic quote
  marks. Quotes appear only inside history.
- **Agent note:** the agent's words, never styled as a quote. They are muted and carry an
  outlined "Agent's note" (or "Agent's summary") label.
- **History:** closed by default and opened by the toolbar's "History" pill on a brainstorm page.
  The pill turns solid when open; the state isn't remembered. When open, history sits below the
  list: date and entry type on the left, then the quote or note and the ideas involved, in date
  order.
- **Panel:** fixed on the right, with a hairline edge. The head holds the idea ID with
  previous, next and close buttons. The body has a large square illustration, the name with its
  status chip, the full bet and an "Open idea" pill (opens the viewer). Then come only the facts
  that exist: Grew from, Led to and Eval, each left out when empty. Next is one quiet line with
  the source path and a copy button. Last is a closed "History" disclosure, present only when
  the idea has entries. Below 900px the panel becomes a bottom sheet over a scrim. Esc closes it
  and the left and right arrow keys step through ideas.
- **Viewer** (`#/<slug>/pass-<n>/<id>/view`): the idea's `url` in a full-screen frame under one
  slim bar. The bar has breadcrumbs (Home / brainstorm / Pass n / id and name), the status chip,
  previous, "2 of 5" and next, an open-in-new-tab button and the theme button. The left and
  right arrow keys step through the pass. Esc returns to the pass with that idea's panel open.
  The frame area is the shell's paper and the frame fades in once it loads, so there is no white
  flash. Under 640px the bar becomes two rows and the crumbs shorten to "Pass n / id". An idea
  with no `url` (or a `url` that is not http(s) or relative) shows a calm line and its source
  path instead of an empty frame.
- **Selection bar:** a floating pill at the bottom showing "3 selected", Copy and Clear. Copy
  gives a plain comma-separated list of idea IDs or brainstorm slugs.

## Customizing

1. **Edit `shell-tokens.css` first.** Change the two base colours, the font, radii, spacing or the
   panel width there, and the whole shell follows. Keep everything else derived from `--ink` and
   `--paper`, so both themes stay in step.
2. If a component's shape has to change, edit `shell/shell.css`. Use tokens only, keep motion to
   position and opacity, and keep the reduced-motion block. A skill update replaces everything
   in `shell/` and `index.html`, so note the change here so it can be carried forward.
3. `shell-tokens.css` and this guide are yours. Updates leave them alone. Narrow screens override
   `--gutter` and `--tile-min` in `shell.css`, so change those breakpoint values there.
