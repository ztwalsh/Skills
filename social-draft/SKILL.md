---
name: social-draft
description: Draft build-in-public posts for Zachary from his rolling build log. Reads ~/sites/personal-projects/social/BUILD-LOG.md for a time window (default: the past week), sweeps git history across all personal projects as a backstop, reads voice.md, and writes ~/sites/personal-projects/social/drafts/YYYY-Www.md — a week-in-review plus 4–8 ready-to-paste Threads/X posts, thread outlines, and shot lists for the visuals. Never posts anything. Triggers on "/social-draft", "draft some posts", "what should I post", "weekly social", "thread ideas", "help me post about what I built".
---

# social-draft: turn the build log into draft posts

Companion to `social-log`. That skill captures the work; this one, run roughly
weekly, turns it into things Zachary can actually paste into Threads or X. It
**drafts only** — no posting, no external calls.

Data dir: `~/sites/personal-projects/social/`.

## Arguments

- `/social-draft` → window = last 7 days
- `/social-draft today` → since 00:00 local today
- `/social-draft 2026-W35` → that ISO week
- `/social-draft 14d` / `/social-draft month` → arbitrary lookback

## Procedure

### 1. Gather

- Read `BUILD-LOG.md`; take every entry whose timestamp is in the window.
- **Backstop sweep:** for each repo under `personalProjectsRoot` (from
  `config.json`), run
  `git -C <repo> log --since="<window start>" --pretty=format:'%h %cd %s' --date=short`.
  Anything committed but missing from the log (manual commits, hook gaps) —
  reconstruct a quick What/Why from `git show <sha>` and fold it in. If it's
  worth keeping, also append a proper enriched entry back to `BUILD-LOG.md` (per
  the `social-log` format) so it's not lost next time.
- Drop `private` projects (`config.json`) and any entry with
  `visibility: private`.
- Read `voice.md` in full. Read the 3–5 most recent files in `posted/` as
  few-shot examples of what actually goes out.

### 2. Cluster

Group the window's work into 3–8 **story candidates**. A story is usually one
project + one theme ("assistantOS menu polish week", "wallpaper app: the new
shuffle logic"). Cross-project themes are fine ("spent the week on tiny UI
details across three apps"). Rank by: has a visual or an easy one > visible
user-facing change > good "why it matters" line > pure internals.

### 3. Write `drafts/<YYYY>-W<ww>.md`

Use `reference/draft-format.md`. Sections:

1. **Week in review** — terse bullets grouped by project. This is for Zachary,
   not for posting.
2. **Post candidates** — 4–8. Each candidate is one story, written *both ways*:
   - **Threads** — up to ~500 chars, 1–3 short paragraphs. The fuller version.
   - **X** — one post ≤280 chars. Tighter, not just a truncation — rework the
     line so it stands on its own. If the story genuinely can't land in 280,
     give a short numbered X thread (2–4 posts) instead and say why.
   When both versions would be nearly identical (a short post), still print
   both slots but note "same as Threads". Both obey `voice.md` (lowercase ok,
   no hype, banned-phrase list, lead with the concrete change). Then one shared
   **visual** (a real path under `assets/` if it exists, else
   `NEEDS CAPTURE: <what>` + create/point at the `SHOT-LIST.md`) and a one-line
   "why this angle".
3. **Thread outlines** — 1–2 for the meatier stories, as numbered posts. Note
   which platform each is aimed at (usually the same thread works on both;
   flag if X's 280/post limit forces a different split).
4. **Carry-forward** — shareable entries from the window not used this week, so
   they resurface next run.

### 4. Commit + push the workspace

The capture hook only writes `BUILD-LOG.md` locally; this is where the `social`
repo actually gets saved. From `~/sites/personal-projects/social`:

```sh
git add -A && git commit -m "social: <ISO week> draft + log" && git push
```

Include everything staged — the new/updated `drafts/<week>.md`, any `BUILD-LOG.md`
entries the backstop sweep enriched, new `assets/*/SHOT-LIST.md` stubs. If
`git push` fails (no network, auth), commit anyway and tell Zachary it's
unpushed. Never `git add` screenshots Zachary hasn't placed yet — only files
this run created or changed.

### 5. Hand off

Print the draft file path and a 2–3 line summary of the strongest candidate,
and note that the workspace was committed/pushed. Do **not** post. If a visual
is missing, the top-line ask to Zachary is "grab these screenshots" with the
`SHOT-LIST.md` path.

## Voice — non-negotiable

Everything in "Post candidates" and "Thread outlines" must pass `voice.md`:
banned phrases out, lead with the concrete thing, one idea per post, pair with a
visual, "I" not "we". When unsure on a line, match the cadence of the `posted/`
examples. For line-level polish you may lean on the `copywriting` skill, but the
voice guide wins any conflict.

## Images

Don't generate images here. Point at real files in `assets/`, or write the shot
list and flag `NEEDS CAPTURE`. For framed device / App Store shots, that's the
`figma-device-mockup` + `image-crop` skills; for web page captures,
`codex/screenshot`. `social-draft` just references what those produce.

## Don't

- Don't post, DM, or hit any social/publishing API. (The only network action
  allowed is `git push` of the `social` repo itself, in step 4.)
- Don't rewrite `voice.md` or historical `BUILD-LOG.md` entries (appending a
  missed enriched entry during the backstop sweep is fine).
- Don't overwrite a prior week's draft file — one file per ISO week; if it
  exists, update in place and note what changed.
- Don't fabricate work that isn't in the log or git history.
