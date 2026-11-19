# Using Stageshow

Stageshow, by Benji Taylor, makes **faux product UI**: stills, feature cards, cursor demos and bento grids that read like the real product, built in React. Most of the quality comes from its rules and its gold examples. The kit just saves you from hand-drawing windows, phones and cursors.

This folder is an unmodified copy of the upstream skill (`benjitaylor/skills`, `stageshow/`, commit `8020574`, 31 Oct 2026). `SKILL.md` is the skill itself. This article covers how to install it, run it and get good results from it.

---

## When to use it

Use it when someone asks for:
- a **faux UI still** or product shot for a launch page, docs or social post
- a **feature card** or **bento grid** of a product
- an **animated demo** with a cursor doing one thing in an interface
- "a mock of our app", "a hero illustration", "a product walkthrough animation"

Skip it for real, working UI. It draws pictures of interfaces, not interfaces.

---

## Install

Pick one:

```sh
# The upstream installer
npx skills add benjitaylor/skills --skill stageshow
```

```sh
# Or from this repo, for Claude Code
cp -r agent-skills/ui/stageshow ~/.claude/skills/stageshow
```

- **Claude Code:** after the copy it shows up as the `stageshow` skill. Say "faux UI", "bento grid" or "product still" and it triggers.
- **Codex / Cursor / others:** point the agent at `agent-skills/ui/stageshow/SKILL.md` and tell it to read it before starting.

---

## One-time setup

The skill's own tooling (a preview playground and a filming script) needs Node 20.19+ and Chrome.

```sh
cd ~/.claude/skills/stageshow        # or wherever the folder lives
npm install --include=optional
```

Run the preview:

```sh
npm run dev
```

**If `npm run dev` fails** (common in containers and CI), skip its port helper and run Vite directly:

```sh
node_modules/.bin/vite playground --config playground/vite.config.ts --port 5180 --strictPort --host 127.0.0.1
```

**Filming needs Chrome.** If Chrome isn't installed in the usual place, point at any Chrome or Chromium:

```sh
export CHROME_PATH=/usr/bin/google-chrome
```

---

## The loop

Everything in `SKILL.md` boils down to this. Don't skip step 3.

1. **Plan first.** Medium (still or animation), size, focal object, the one action, the payoff, and what to leave out. For a grid, write the tile table in `references/bento.md` before building anything.
2. **Map the product's look.** Read its real tokens (CSS variables, Tailwind config, `kit.css`) and map them to the kit's `--ss-*` tokens (`references/looks.md`). Use the product's own font and icon set, not Lucide by reflex.
3. **Film the closest gold example and copy it.** The gold table in `SKILL.md` maps each need to an example.
   ```sh
   node scripts/film.mjs "http://127.0.0.1:5180/?capture=static-card" --select '#example' --still --out gold.png
   ```
   Copy that folder to `examples/<yours>/`. The playground picks it up automatically at `?capture=<yours>`.
4. **Build the screen.** Use 3 to 7 real strings and make the rest `Bar` filler. Crop hard: the hero runs off an edge and only filler gets cut (`references/framing.md`).
5. **Film your still and read the checks.** `film.mjs` prints `framing:`, `cut by the crop:`, `touching:` and `tight inset:` lines. Fix framing first, then hierarchy, then polish.
   ```sh
   node scripts/film.mjs "http://127.0.0.1:5180/?capture=<yours>" --select '#example' --still --gate
   ```
6. **Put it beside the gold.** If yours is emptier, flatter or more boxed, that's the next fix. Then run the fresh-eye review in `references/review.md`.

---

## Prompts that work

- "Use Stageshow. A feature-card still (400 × 300) of our billing page: one invoice marked paid, a receipt as satellite. Our tokens are in `src/styles/tokens.css`."
- "Use Stageshow. A bento grid for the features section: five tiles, hero and strip. Plan the tile table first."
- "Use Stageshow. A 12-second cursor demo: the user drags a card to Done and the column count rolls."

Name the **size**, the **one thing that happens**, and **where the product's look lives**. Those three decide most of the result.

---

## Exporting for social

Stages are designed at the size they'll be seen, so for social posts:

- **Design at 16:9**, e.g. 800 × 450, with the UI at 1.3–1.5x (the close-up layout) so it stays legible on a phone.
- **Capture the stage element at 2–3x device scale** with Playwright: 800 × 450 at 3x gives 2400 × 1350.
- **X's sweet spot is 1600 × 900 or larger.** Export a JPG at about 92% quality as well as the PNG master, since X recompresses PNGs.
- **For a bento**, capture the whole grid element. Each tile is still its own `Stage` at 1:1.

```js
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, deviceScaleFactor: 3 });
await page.goto('http://127.0.0.1:5180/?capture=<yours>', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.locator('#example .ss-stage').first().screenshot({ path: 'still.png' });
```

---

## Pitfalls

- **Too many words.** Count the real strings. If it's more than about 7, turn the rest into `Bar`.
- **A window floating with even margins on four sides.** That's a screenshot pasted in. Crop 10 to 40% of the hero off an edge.
- **A control cut by the stage edge.** Only filler may be cut. Move the crop to a gap, or turn the cut row into filler.
- **Invented icons and logos.** Use the product's own icon set. No sparkles or purple for "AI".
- **Using the product's real imagery?** Renders, avatars and art make it recognizable, so keep them. Licensed icon sets and fonts stay wherever their licence allows. Check before pushing to a public repo.

---

## Files

- `SKILL.md`: the skill (upstream, unchanged)
- `references/`: framing, craft, motion, bento, looks, review, verify, rehearse
- `examples/`: the gold examples, product studies and specimen sheets
- `kit/`: the React parts (`Stage`, `Window`, `Phone`, `Bar`, `Row`, the motion helpers)
- `scripts/film.mjs`: films a stage into stills and contact sheets, with layout checks
- `LICENSE` (MIT) and `NOTICE.md`: keep both with any copy
