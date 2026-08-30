# BUILD-LOG.md entry format

Newest entry first, directly below the `<!-- entries below -->` marker. Each entry
is one `##` block. No blank lines inside a block; one blank line between blocks.

## Header line

```
## <YYYY-MM-DD HH:MM> · <project> · <sha>[, <sha>...]
```

- Timestamp: local time of the (first) commit, or of writing if uncommitted.
- `project`: the repo's directory basename (`assistantOS`, `wallpaper`, `ztwalsh.com`).
- One or more short SHAs, comma-separated, when several commits are merged into
  one entry. Use `uncommitted` if nothing's committed yet.

## Body fields (in order)

| Field | Rule |
|---|---|
| `**What:**` | 1–2 sentences, plain language, assumes no repo knowledge. Describe the change a user or reader would see or feel, not the code move. |
| `**Why it matters:**` | The reason a stranger scrolling by would care — friction removed, the thing that had been nagging, why the detail is worth it. One or two sentences. If it's genuinely just plumbing, say that plainly. |
| `**Shareable:**` | `yes — <what to capture>` or `no`. `yes` also means: create the matching `assets/<date>-<project>-<slug>/SHOT-LIST.md`. |
| `**Tags:**` | space-separated `#kebab` tags. See list below. |
| `_<git stat>_` | the `git show --stat` summary line + optional branch note. The hook fills this; leave it. |
| `status:` | `stub` (hook wrote it, needs enrichment) or `enriched` (done). |

## Tag vocabulary

`#new-feature` `#polish` `#ui` `#perf` `#bugfix` `#refactor` `#infra`
`#integration` `#zapier` `#ai` `#design` `#content` `#experiment` `#dx`

## Worked example — stub → enriched

Stub the hook wrote:

```
## 2026-08-29 14:32 · assistantOS · a1b2c3d
**What:** Add Google Drive app icon to push dropdown; resize all menu items
**Why it matters:** _(stub — enrich me)_
**Shareable:** ?
**Tags:**
_3 files changed, 41 insertions(+), 12 deletions(-) · branch `main`_
status: stub
```

After enrichment:

```
## 2026-08-29 14:32 · assistantOS · a1b2c3d, e4f5a6b
**What:** The "Push to Google Drive" menu in the doc viewer now shows the real
Google Drive logo instead of a generic hard-drive glyph, and every dropdown in
the app moved to 14px text with roomier padding.
**Why it matters:** The push-to-Drive flow finally reads as a real integration
rather than a stock menu — the kind of small thing that decides whether a side
project feels legit. And the menu type scale now matches the Figma spec
everywhere instead of just on the screens I'd gotten to.
**Shareable:** yes — before/after of the dropdown open, plus the menu with the
new type scale next to an old screenshot.
**Tags:** #polish #ui #integration #zapier
_3 files changed, 41 insertions(+), 12 deletions(-) · branch `main`_
status: enriched
```

Note the two SHAs merged onto the header, the `status` flip, and that "Why it
matters" is about the reader, not the diff.
