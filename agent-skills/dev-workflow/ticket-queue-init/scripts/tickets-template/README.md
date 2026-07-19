# Ticket queue

Drop a ticket here to have it picked up by the automated build loop
(`automation/run-queue.sh`, meant to run hourly via launchd once you've
loaded the job — see the launchd plist written alongside this setup).
Copy `_template.md`, fill it in, leave `status: todo`.

## Lifecycle

`todo` → (picked + locked by the queue script) → `in-progress` → `review`
(draft PR opened, or parked with a note if something needs a human look) →
`done` (flip this manually once you've merged the PR).

## What the queue script does with a ticket

1. Picks the highest-priority `todo` ticket, flips it to `in-progress`,
   commits that status change to `main` (metadata only, not code — this is
   the lock).
2. Runs headless Claude Code in an isolated git worktree, pointed at this
   repo's `ship`-style skill (see `.claude/ticket-queue.config`), with the
   ticket body as the spec.
3. Diffs the result against the ticket's `scope:` globs. Out-of-scope
   changes get parked in `review` with a note instead of auto-landing.
4. On a clean pass: opens a draft PR, flips the ticket to `review`, sends a
   macOS notification, tears down the worktree.
5. On a hit-the-revision-cap outcome: same landing, but the ticket note
   says `escalation` and includes the ship loop's own escalation memo.

This queue was scaffolded by the `ticket-queue-init` skill
(`~/.claude/skills/ticket-queue-init`). Re-run that skill if `automation/`
needs to be refreshed with upstream fixes.
