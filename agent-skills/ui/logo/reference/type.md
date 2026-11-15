# The wordmark and typefaces

A logo project always has a wordmark. Ask for it every time. It comes from one of two places,
and a project can hold both.

## 1. Supplied artwork

The user gives the name as SVG outlines. This is theirs: **never redraw it, re-space it or swap
its letters.** Lockups only ever move the pieces.

1. Save the file as received in `logo/wordmark/`.
2. Take the path data for each word. For a two-word name that needs two paths; if the artwork is
   one path, split it at the gap between the words (path data is a list of closed sub-paths; each
   belongs to one letter).
3. Read three numbers off the artwork, in its own coordinates:
   - `baseline`: the y the letters sit on
   - `xTop`: the y of the top of the lowercase letters (x, o, e, n). For an all-caps name use the
     cap top here too.
   - `ascTop`: the y of the top of the tall letters (h, k, l) or the caps
4. For a two-word name, work out `joinShift`: how far the second word moves left so the two read
   as one word. Match the typeface's own spacing between those two letters if you can measure
   it; otherwise match the average gap between the other letter pairs in the artwork. Say in the
   report that this gap is a judgment and show the user the joined lockups.
5. Put all of it in `wordmark.supplied` and set `wordmark.active` to `"supplied"`.

Check the result in the viewer: the inline, mark-first and stacked lockups should look right at
the header size and at 16px.

## 2. Exploring typefaces

When there is no artwork, or the user wants to compare, candidates come from Google Fonts. The
viewer loads them live, so any family on Google Fonts works with no setup.

1. **Propose eight to twelve.** Cover real range rather than twelve geometric sans: a couple of
   grotesques, a humanist sans, a geometric, one or two serifs, a mono or a display face if the
   brand could carry it. Prefer families with several weights. Say in one line each why it suits
   this product.
2. Add each to `wordmark.fonts`:

   ```json
   { "id": "fraunces-400", "family": "Fraunces", "weight": 400, "tracking": -0.02, "transform": "lowercase" }
   ```

   - `id`: kebab-case family plus weight. Permanent once shown.
   - `family`: exactly as Google Fonts spells it.
   - `tracking`: letter spacing in em. Display-size wordmarks usually want it slightly negative.
   - `transform`: `"lowercase"`, `"uppercase"` or `"none"` (as typed in `wordmark.parts`).
   - `italic`: `true` for the italic.
   The same family at two weights is two entries.
3. Sync. Typefaces are chosen in the viewer's **preview panel**, in every round: select a mark,
   then switch the wordmark at the top of the panel. Every lockup, the app header and the
   summary page follow the pick, so marks and type are judged together. The panel's copy
   control gives the user the mark and font ids to paste back ("r4-029 with fraunces-400").
4. **Log the choice.** A typeface pick is a decision: a `note` entry with the user's words, and
   set `wordmark.active` to that font's id. Fonts they rule out get a `dropped`-style `note` too.
   Nothing is removed from `wordmark.fonts`.

Typeface and mark affect each other. It is normal to pick a few marks, try type, and find the
type changes which mark wins. Run type exploration whenever the user asks, not only at the start.

Google Fonts are open-licensed and free for commercial use, including in a logo. Say so if asked,
and point at the family's page for its exact licence.

## 3. Outlining a typeface (needed before export)

A live font is fine for exploring. A finished logo must be **outlines**: shapes, not text that
depends on a font being installed. The summary page will not export lockups until the active
wordmark is outlines, and `sync.mjs` warns about it.

### The usual way: the outline script

```
node logo/viewer/outline.mjs              # the active font
node logo/viewer/outline.mjs <font-id>    # one font
node logo/viewer/outline.mjs --all        # every font not yet outlined
node logo/viewer/sync.mjs
```

It sets the name in that family, weight, tracking and case, with the font's own kerning, and
writes the shapes and their measurements into `wordmark.fonts[n].outline` (the same fields as
`wordmark.supplied`). From then on the viewer uses the outlines for that font everywhere.

- The font file is downloaded once from the Fontsource CDN, the open-source mirror of Google
  Fonts, into `logo/wordmark/fonts/<id>.ttf`, and reused after that. This is the only step in
  the skill that needs the network.
- If the download fails (offline, or a family Fontsource does not carry at that weight), put
  the font file at that path yourself and run the script again.
- Outlining every candidate with `--all` is fine and makes the viewer work offline. At the
  least, outline the font the user picks.
- Changing a font's `tracking`, `weight` or `transform` afterwards means outlining it again
  with `--force`.
- The script uses opentype.js (MIT licence), bundled in `viewer/vendor/`. Nothing is installed.

After outlining, look at the joined name ("movethink") in the viewer. The gap at the join comes
from the font's own kerning; if it looks wrong at display size, adjust `joinShift` by hand and
say so in the report.

### The fallback: outlines from a design tool

If the script cannot be used, ask the user to export the name from a design tool. In Figma: type
it in the chosen family, weight and tracking, then Outline stroke, and Copy as SVG; for a
two-word name, one text layer per word. Treat what they send exactly like supplied artwork
(section 1), but store it in that font's `outline`.

Do not trace or approximate letter shapes yourself, and do not rebuild them from geometry.
