---
name: social-log
description: Keep a rolling build log across all of Zachary's personal projects — the raw material for building in public. A PostToolUse hook drops a stub into ~/sites/personal-projects/social/BUILD-LOG.md after every commit; this skill turns that stub into an enriched entry (plain-language what changed, why it matters to a reader without the repo open, whether there's a screenshot worth grabbing). Triggers automatically on the hook's post-commit nudge, and on "log this", "add to the build log", "what did I ship", or right after any commit in a personal project. Pairs with social-draft, which reads the log weekly to draft posts.
---

# social-log: capture the work as it happens

The point: Zachary ships small improvements to his own apps constantly and wants
to post about them (Threads / X) but never captures the work in the moment. This
skill makes the build log fill itself in as a byproduct of committing, so the
weekly `social-draft` pass has something to work from.

**Data lives in `~/sites/personal-projects/social/`** (its own git repo):
`BUILD-LOG.md` (the log), `voice.md`, `config.json`, `assets/`, `drafts/`,
`posted/`. This skill only ever writes `BUILD-LOG.md` and `assets/*/SHOT-LIST.md`.

## How a stub gets there

The hook `hooks/post-commit-capture.sh` (wired into `~/.claude/settings.json` as a
`PostToolUse` / `Bash` hook — see `install.md`) fires after every successful
`git commit` in any repo under `~/sites/personal-projects`. It:

- resolves which repo was committed to from the hook payload's `cwd`, then
  **also scans every repo under `~/sites/personal-projects`** for one whose HEAD
  moved in the last 90s — so `cd other-repo && git commit` compound commands
  (payload `cwd` is stale for those) and bare-terminal commits still get caught.
  Can log more than one repo in a single fire.
- skips the `social` repo itself and any project marked `private` in `config.json`
- dedupes on short SHA, so a re-fire never double-logs
- prepends a `status: stub` block below the `<!-- entries below -->` marker
- emits an `additionalContext` nudge telling you (Claude) to enrich it

A stub looks like:

```
## 2026-08-30 07:39 · assistantOS · f7a6256
**What:** Restyle dropdown menus to match Figma spec
**Why it matters:** _(stub — enrich me)_
**Shareable:** ?
**Tags:**
_3 files changed, 41 insertions(+), 12 deletions(-) · branch `main`_
status: stub
```

## Your job: enrich it

**Whenever this skill is triggered — the hook's nudge, or the user asking —
open `BUILD-LOG.md` and enrich EVERY `status: stub` block in it, not just the
newest.** Stubs accumulate from unattended `ticket-queue` runs and from
sessions that ended before acting on their nudge; clear the whole backlog each
time. Work oldest-first, using `git -C <repo> show <sha>` (and surrounding
commits) for context on anything you didn't do yourself. If a stub's repo no
longer exists or the SHA is unreachable, enrich it from the `**What:**` line
and stat alone and add `_(reconstructed from commit metadata)_` to Why.

Rewrite each stub in place. Full format + a worked example:
`reference/entry-format.md`. In short:

1. **What** — one or two sentences, plain language, no repo knowledge assumed.
   "Gave the Drive-push dropdown the real Google Drive logo and bumped every menu
   in the app to 14px with more padding." Not "refactored DropdownMenuItem".
2. **Why it matters** — the reason a stranger would care. The friction it removed,
   the thing that had been bugging you, why the polish is worth noticing. This is
   the line `social-draft` leans on hardest. If it's genuinely minor plumbing,
   say so and set `Shareable: no` — not everything needs a post.
3. **Shareable** — `yes` + what to capture, or `no`. If `yes`, create
   `~/sites/personal-projects/social/assets/<YYYY-MM-DD>-<project>-<slug>/SHOT-LIST.md`
   with a short list of shots ("dropdown open, before/after"; "settings sheet on
   device"). Don't try to take the screenshots — just name them.
4. **Tags** — a few `#kebab` tags: `#polish #ui #zapier #perf #new-feature #bugfix`.
5. Set `status: enriched`.

**Granularity — merge aggressively.** One stub per commit, but one *entry* per
unit of work. A feature that landed in 6 commits (or a `ship` loop's worth of
revise-commits) becomes a single entry — delete the extra stubs, keep one
enriched block, list every SHA on the header line
(`· f7a6256, a1b2c3d, 9x8y7z0`). If you just did the work this session you have
the context; use it.

## Manual use

- "log this" / "add that to the build log" — write an enriched entry directly,
  no stub needed. Use the same format. Timestamp = now, real SHA if it's committed
  (`git rev-parse --short HEAD`), else `uncommitted`.
- "what did I ship this week" — read `BUILD-LOG.md`, summarize; don't draft posts
  (that's `social-draft`). While you're in there, clear any stubs too.
- "commit the log" / after enriching — `git -C ~/sites/personal-projects/social
  add -A && git commit -m "log: enrich <n> stub(s)" && git push`. The hook only
  writes the file; nothing commits it unless you or `social-draft` do.

## Don't

- Don't touch `drafts/`, `voice.md`, `posted/`, or `config.json`.
- Don't post anything anywhere. This skill only writes files.
- Don't invent significance. A dependency bump is a dependency bump.
- Don't reformat or re-sort existing enriched entries; only work the new stubs.
