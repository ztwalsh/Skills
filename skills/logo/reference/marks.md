# Drawing a round of marks

## What a good round looks like

A grid a person can scan in a minute and point at: "17, 20, 38, 42." That only works when every
mark is one clear idea, distinct from its neighbours, and drawn with the same care.

- **One idea per mark.** If it needs explaining, it is two ideas. Split it or drop one.
- **Simple.** A mark should survive being drawn from memory. A few shapes, clean geometry.
- **One colour, solid.** No tints, gradients, outlines for decoration, or hairlines that vanish
  small. Cut-outs and gaps are fine.
- **From the product, not from the category.** Start with what this product is and does for a
  person. Category symbols (below) are what every competitor already has.
- **It has to live beside the wordmark.** Weight, angle and corner softness should sit with the
  type. A mark that fights the letters loses, however good it is alone.
- **Named.** Two or three plain words that say what it is ("Half and stroke", "Rows into one").
  The name is how the user and the log refer to it besides the number.

## Families

A round is built from families of about ten. A family takes one idea and pushes it along one or
two dimensions (weight, count, angle, spacing, cut, fill) so the user can see the idea's range,
not ten unrelated guesses.

**Round 1 ranges widely.** A useful spread, adapted to the product:

1. The existing mark, refined (001 is the current mark exactly as supplied, if there is one)
2. A letter or letters of the name, as geometry, never as lettering
3. What the product literally does
4. What it feels like to use
5. The moment before and after (a change, a resolution)
6. Two things in relation (the name's two halves, the user and the product)
7. Time, rhythm or repetition, if the product has one
8. Negative space: the idea cut out of a circle, a square, the app tile
9. A wildcard family: bolder and stranger, still one idea each

Write each family's one-line note before drawing. If you cannot say the idea in a line, the
family is not ready.

**Later rounds narrow.** They grow from the user's picks and stay inside the picks' own
vocabulary. See "The next round" in `SKILL.md`.

## Stay away from

Unless the user asks for one:

- The category's stock symbols: for fitness, a running figure, a heartbeat line, a dumbbell; for
  AI, sparkles, a brain, a chat bubble; for finance, an upward arrow, a coin; for audio, a
  microphone; and so on for whatever category this is.
- A letter in a rounded square. A generic swoosh. Overlapping translucent circles.
- Any mark that reads as an existing well-known logo. If it reminds you of one, drop it.
- Anything the user listed as a dislike.

## The box

- Every mark is drawn in a **140 × 140 box**, centre (70, 70), in SVG user units.
- Fills use `currentColor`. Never write a hex colour in a mark.
- The viewer measures each mark, centres it, and scales it down to fit inside 128 units. So
  proportions matter and absolute size does not. Use `s` to make a mark optically larger or
  smaller after the fit, and `dx` / `dy` to nudge a lopsided one.
- `fixed: true` skips the fit: the mark is drawn exactly as given. Use it for supplied artwork
  and for finished marks whose position in the box is deliberate.
- Where markup needs an id (a mask or clip), write `§` in the id. The viewer replaces it with a
  unique token per instance. The helpers below already do this.
- Shapes that touch should be drawn as **one path**. Two shapes that merely abut show a hairline
  seam on some screens.
- Anything that varies randomly must be **seeded**, so a mark is the same drawing every time it
  is rendered.

## Helpers

`viewer/geo.mjs` (copied to `logo/viewer/geo.mjs`) returns SVG markup strings. Import what you
need in a round file: `import { bar, dot, knock } from '../viewer/geo.mjs'`.

| Helper | Draws |
|---|---|
| `dot(cx, cy, r)` | A disc |
| `ring(cx, cy, r, w)` | A circle outline of weight `w` |
| `rrect(cx, cy, w, h, r)` | A rounded rectangle centred on a point |
| `bar(p, u, len, w, r?, a?)` | A rounded bar, placed by offsets across (`p`) and along (`u`) a lean of `a` degrees |
| `barAt(x, y, len, w, r?, a?)` | The same, centred on a point |
| `slant(xc, yc, h, wh, a?)` | A parallelogram with flat ends: an italic stem |
| `line(x1, y1, x2, y2, w, cap?)` | A stroked line |
| `sp(d, w, cap?, join?)` | A stroked path from path data |
| `fp(d, evenodd?)` | A filled path from path data |
| `poly(points)` | A filled polygon |
| `dome(cx, base, r)` | A half disc standing on a base line |
| `hull(x0, y0, r0, x1, y1, r1)` | Two circles joined by their outer tangents: a swelling stroke |
| `knock(solid, cut)` | `solid` with `cut` removed from it |
| `clip(shape, body)` | `body` visible only inside `shape` |
| `g(transform, body)` | A group with a transform |
| `pt(p, u, a?)` | A point `[x, y]` offset from the centre along a lean (not markup) |
| `arcD`, `circ`, `hullD`, `barPoly` | Path data, for building compound paths with `fp` |

`A` is the default lean in degrees (30). Pass your own angle where the brand has one. Anything
the helpers do not cover, write as plain SVG: a mark is only a string.

Loops and small functions are encouraged: a family is usually one function called with ten sets
of numbers.

## Reviewing a round

After syncing, open `logo/index.html` and go through the whole grid at desktop width.

1. **In the grid:** does each mark read in a second? Are any two the same idea? Does any family
   look like one mark ten times, or ten unrelated marks?
2. **In the panel:** select marks and look at the lockups, the app-icon tiles and the size
   ladder, in light and dark. Look hardest at 16 to 32px.
3. **Replace** the weak ones and look again. Two passes at least. A third of a first draft
   being replaced is normal.
4. **Keep notes** on the ones you would shortlist and the weakest you left in. Both go in the
   report, and the shortlist goes in the log as a `recommend` entry.

Be exacting about sameness and cliché, and say so plainly in the report. The user picks; the
round should make picking easy.
