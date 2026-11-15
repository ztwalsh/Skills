# Playground shell design

This guide covers only the shell: the index, the tables, the grids and the idea panel. It never
governs the ideas themselves. Each idea follows its own project's DESIGN.md.

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
5. **Status is shape, not colour.** Chosen gets an outlined chip, final a solid chip. Dropped is
   dimmed, with a faint chip, and is still listed.
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
| `--dim` | 0.42 | Opacity of dropped ideas and archived brainstorms |
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
- **Page head:** a large title, one muted meta line (date, counts, status chip) and an optional
  description.
- **Controls:** pill-shaped search and date fields, a "Chosen only" pill (solid when on) and a
  List/Grid segmented switch on the right. The switch is remembered.
- **Grid:** square cards in a ruled grid. Each card has a thumbnail, then its text. Idea cells
  show the number in medium weight, the name muted and a status chip. A checkbox sits on the
  thumbnail's corner. It shows on hover or focus, always on touch screens, and on every card
  once anything is selected.
- **Placeholder tile:** shown when an idea has no thumbnail, or its thumbnail fails to load. The
  number is large and the name small, on a 4% tint. There is never a broken image.
- **Table:** small muted column heads, hairline rows and tabular numbers. A whole row opens on
  click. On narrow screens the secondary column (description, bet or quote) moves under the
  name, and minor columns drop out.
- **Quote:** the user's words, verbatim, with a 1px ink rule on the left, typographic quote
  marks and "User" beneath. The brief is set larger.
- **Agent note:** the agent's words, never styled as a quote. They are muted and carry an
  outlined "Agent's note" (or "Agent's summary") label.
- **History:** date and entry type on the left, the quote or note and the ideas involved on the
  right, in date order.
- **Panel:** fixed on the right, with a hairline edge. The head holds the idea ID with
  previous, next and close buttons. The body has a large square illustration, the name and
  chip, the bet, an "Open idea" pill and a facts list (status, grew from, led to, eval, source
  with a copy button), then that idea's history. Below 900px it becomes a bottom sheet over a
  scrim. Esc closes it and the left and right arrow keys step through ideas.
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
