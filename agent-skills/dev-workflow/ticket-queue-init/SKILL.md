---
name: ticket-queue-init
description: Scaffold a markdown ticket queue and unattended build-loop automation (tickets/, automation/run-queue.sh, a launchd plist) into the current repo, wired to that repo's ship-style skill. Use when the user wants to set up "the ticket system" or "the automated build loop" in a project, or asks to bring the pattern used in cardio-tracking into a new repo. Setup only — does not load the launchd job or run anything unattended on its own.
---

# ticket-queue-init: scaffold a per-repo unattended ticket queue

This sets up the same pattern proven in `cardio-tracking`: drop a markdown ticket into `tickets/`, and an hourly job picks it up, implements it in an isolated worktree via headless Claude Code + the repo's `ship` skill, and lands a draft PR for review. This skill only scaffolds — it never loads the launchd job or runs a ticket itself. That's a separate, explicit step the user takes after a manual dry run.

Read this whole file before doing anything; the setup has a specific order because later steps depend on config decided in earlier ones.

## What this skill assumes

- The target repo already has (or will get, separately) a `ship`-style skill — either the global `~/.claude/skills/ship` or a project-local `.claude/skills/<name>`. If neither exists yet, tell the user and offer to point them at the global `ship` skill (in this same `Skills` repo, `agent-skills/dev-workflow/ship`) instead of inventing build/review logic here.
- The target repo is a git repo with a `main` branch and a GitHub remote (`gh` CLI authenticated). If `gh auth status` fails, stop and tell the user — the queue can't land PRs without it.
- macOS + launchd for scheduling (this skill's plist template is launchd-specific). If the target machine isn't macOS, still scaffold `tickets/`/`automation/` — they're portable bash/python — but skip the plist step and tell the user they'll need their own scheduler (cron, a CI cron job, etc.).

## Setup steps

1. **Confirm a ship-style skill exists or is wanted.** Check `.claude/skills/` in the target repo, then `~/.claude/skills/`. If a project-local one exists, ask if that's what tickets should invoke (record its name). Otherwise default to the global `ship` skill.
2. **Ask about secrets.** Does this repo have any gitignored files a fresh `git worktree` wouldn't carry, that are needed to build or run (API keys, local config, a `Secrets.swift`-equivalent)? Collect the relative paths (empty list is a valid, common answer).
3. **Scaffold `tickets/`.** Copy `scripts/tickets-template/_template.md` and `scripts/tickets-template/README.md` from this skill into `<repo>/tickets/`. Edit the example `scope:` glob in `_template.md` to actually match the target repo's real top-level source directory (don't leave `src/**` if the repo doesn't have a `src/`).
4. **Scaffold `automation/`.** Copy `scripts/ticket_meta.py`, `scripts/ticket-prompt-template.txt`, and `scripts/run-queue.sh` from this skill into `<repo>/automation/`, preserving executable bits (`chmod +x automation/run-queue.sh automation/ticket_meta.py`). Copy these verbatim — don't rewrite them per-project. If you find yourself wanting to change their logic for a specific repo's quirk, that's a signal the fix belongs in this skill's `scripts/` upstream, not as a one-off local edit; ask the user which they want.
5. **Write `.claude/ticket-queue.config`** from `scripts/ticket-queue.config.template`, filling in `SHIP_SKILL` (from step 1) and `SECRET_PATHS` (from step 2).
6. **Add `automation/logs/` and `.claude/worktrees/` to `.gitignore`** (create entries if not already covered — the queue's own dedicated worktree lives at `.claude/worktrees/queue-main`, alongside `claude -w`'s per-ticket worktrees; a repo that otherwise tracks `.claude/` for shared agent/skill configs, e.g. one with `.claude/agents/` committed, still needs this specific subpath excluded).
7. **Write the launchd plist** from `scripts/launchd.plist.template` to `~/Library/LaunchAgents/com.<user>.<repo-slug>-ticket-queue.plist`, substituting `{{LABEL}}` (e.g. `com.ztwalsh.<repo-slug>-ticket-queue`), `{{REPO_ROOT}}` (absolute path to the target repo), and `{{CLAUDE_BIN_DIR}}` (directory containing the `claude` binary — `dirname "$(which claude)"`). **Do not run `launchctl load` on it.** Tell the user the plist is written but not active.
8. **Commit and land the scaffolding.** Same discipline the queue itself will use: commit `tickets/`, `automation/`, `.claude/ticket-queue.config`, and the `.gitignore` change on a small branch, push, open a PR against `main` (not a direct push) — unless the user explicitly says to commit straight to `main` for this one-time setup. Get their confirmation before pushing anything.
9. **Dry run.** Once the scaffolding PR is merged: write one real (or clearly-marked trivial test) ticket, get it committed to `main`, then run `automation/run-queue.sh` by hand (`TICKET_BUDGET_USD=3 ./automation/run-queue.sh` is a reasonable first cap) and watch it end-to-end. Expect this to surface at least one repo-specific wrinkle the first time — it did in every repo this pattern has been set up in so far. Fix forward, verify the ticket lands a real PR, confirm no worktrees or branches are left stray (`git worktree list`, `git branch -a`), before suggesting the user load the launchd job.
10. **Only after a clean dry run**, ask the user whether to `launchctl load` the plist. Loading it is the one genuinely hard-to-reverse step in this whole setup (it starts unattended, budget-spending, PR-opening automation) — always get explicit confirmation immediately before doing it, don't bundle it into an earlier "yes" to the overall setup.

## Known gotchas already fixed in the shipped scripts — don't reintroduce them

- **No `timeout`/`gtimeout` on stock macOS.** `run-queue.sh` hand-rolls the wall-clock cap with a background job + sleep-then-kill watchdog. Don't "simplify" this back to a bare `timeout` call.
- **`claude -w <name>` names the branch `worktree-<name>`, not `<name>`.** The script resolves the actual branch from `git worktree list --porcelain` rather than assuming — don't push/PR against the name passed to `-w` directly.
- **Worktrees created by `claude -w` are locked** (for the tool's own session tracking) — `git worktree remove` needs `git worktree unlock` first or it silently no-ops and leaves the worktree behind.
- **The queue must never operate on whatever's checked out interactively.** `run-queue.sh` uses a dedicated worktree on its own branch (`queue-main-snapshot`, kept in sync with `origin/main` via fetch + hard reset), decoupled from the user's actual working directory (which is very often a dirty feature branch mid-work, or simply main itself). Don't collapse this back into operating directly on the user's primary checkout.
- **The dedicated worktree lives inside the repo (`.claude/worktrees/queue-main`), not as a visible sibling directory** (e.g. `<repo>-queue-main` next to `<repo>`). An earlier version did the latter and it showed up as directory clutter the user explicitly didn't want, across every repo `ticket-queue-init` had touched. Nesting it under `.claude/worktrees/` keeps it out of a normal directory listing and mirrors where `claude -w` already places its own per-ticket worktrees.
- **A single non-interactive `claude -p` invocation cannot resume.** The prompt template explicitly forbids backgrounding long commands inside the headless run — an earlier version of this without that instruction burned real budget and time on a session that "kicked off the build in the background" and then exited before finishing anything. Keep that paragraph in `ticket-prompt-template.txt`.

## Verification

- `ls automation/ tickets/ .claude/ticket-queue.config` in the target repo shows the scaffolded files.
- `git worktree list` and `git branch -a` are clean (no stray `ticket-*`/`worktree-*` entries) both before and after the dry-run ticket.
- The dry-run ticket produces a real draft PR, and its `tickets/<id>.md` frontmatter reads `status: review` with a `pr:` field.
- The launchd plist exists at `~/Library/LaunchAgents/` but `launchctl list | grep <label>` shows nothing until the user explicitly asks to load it.
