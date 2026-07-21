# Ticket queue

Drop a ticket here — by hand, or via an app that writes directly to this
directory — and the queue reacts on its own (`automation/run-queue.sh`,
triggered by launchd `WatchPaths` on this directory once you've loaded the
job — see the launchd plist written alongside this setup). You don't even
need to commit it yourself; the queue auto-commits new/changed tickets it
finds sitting here as its first step. Copy `_template.md` to start one,
fill in the `title`/`What`/`Why` at minimum, leave `status: todo` — you
don't need to fill in `scope:` or fully flesh out `Acceptance criteria`,
the queue's refine phase does that before anything gets implemented.

## Lifecycle

`todo` → (picked + locked by the queue script) → refined into a
well-scoped spec → `in-progress` (implemented, reviewed) → `review`
(draft PR opened, or parked with a note if something needs a human look) →
`done` (flipped automatically the next time the queue runs after you merge
the PR — it checks every `review` ticket's `pr:` link against real GitHub
PR state each run; nothing to do by hand).

## What the queue script does with a ticket

0. Every run, first syncs any new/changed ticket files sitting in this
   directory into its own queue history (auto-committing them), then
   checks every ticket already sitting in `review` against its `pr:`
   link's actual GitHub state — merged PRs get flipped to `done`,
   closed-without-merging PRs get a note flagging it for a look.
1. Picks the highest-priority `todo` ticket, flips it to `in-progress`,
   commits that status change to `main` (metadata only, not code — this is
   the lock).
2. Refines it: a headless pass reads the raw ticket, explores the codebase
   read-only, and fills in a real `scope:` and concrete acceptance
   criteria — this is what makes a one-paragraph rough idea into something
   the next step can actually implement without guessing.
3. Runs headless Claude Code in an isolated git worktree, pointed at this
   repo's `ship`-style skill (see `.claude/ticket-queue.config`), with the
   refined ticket as the spec.
4. Diffs the result against the ticket's `scope:` globs. Out-of-scope
   changes get parked in `review` with a note instead of auto-landing.
5. On a clean pass: opens a draft PR, flips the ticket to `review`, sends a
   macOS notification, tears down the worktree.
6. On a hit-the-revision-cap outcome: same landing, but the ticket note
   says `escalation` and includes the ship loop's own escalation memo.

## When this actually triggers

launchd `WatchPaths` fires when a file is added to or removed from this
directory — not on edits to an existing ticket's content alone. Adding a
new ticket, or deleting one, triggers a run within moments. Editing an
existing not-yet-picked-up ticket's body, with nothing added or removed,
won't trigger one on its own — it'll get picked up next time something
else does.

This queue was scaffolded by the `ticket-queue-init` skill
(`~/.claude/skills/ticket-queue-init`). Re-run that skill if `automation/`
needs to be refreshed with upstream fixes.
