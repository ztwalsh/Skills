---
name: ship
description: Run the standing build-and-review loop on one work item in the current repo — implement, then get it checked by whichever of code-reviewer/design-qa/ux-reviewer subagents exist locally, revise on any fail, cap at 5 rounds. Use whenever asked to build/fix/ship a specific feature, screen, or component and it should be checked against the repo's own ground-truth docs before being called done — so the loop never has to be re-specified per project or per item.
---

# Ship: the repeatable build → review loop

This is a portable version of a loop first proven in two separate repos (an iOS/SwiftUI app, a multi-directory HTML/React design-exploration repo) — it works the same way in either because almost nothing about the loop itself is repo-specific. The two things that *are* repo-specific — what ground truth to build against, and how to gate a build — are discovered at the start of each run, not hardcoded here.

**You (the invoking agent) are the builder.** There is no separate "builder" subagent — you implement directly, with full context of the conversation and the work item. The three reviewers run as separate subagents specifically so they judge the diff cold, without your implementation reasoning biasing them.

## Step 0: discover ground truth and the gate command (once per run)

Do this before touching any code:

1. **Ground-truth docs.** Look for, in order, and use whatever is found first:
   - A project-local `.claude/ship.md` or `.claude/ship.config.json` that explicitly names the doc(s) to check against and the gate command. If this exists, trust it completely and skip to step 2.
   - Common filenames at the repo root or in the target subdirectory: `DESIGN.md`, `PRODUCT.md`, `PROMPT.md`, `AGENTS.md`, `CLAUDE.md`. A repo may have more than one relevant doc (e.g. `DESIGN.md` for visual language + `PRODUCT.md`/`PROMPT.md` for functionality/scope) — use whichever combination actually exists.
   - If the repo holds multiple self-contained sub-projects (e.g. `test-1/`, `test-2/`, each with its own `DESIGN.md`), identify which one the work item lives in first, and use only that sub-project's docs. **Never blend ground truth across sibling sub-projects** — a work item scoped to one variant is checked only against that variant's own docs.
   - If nothing is inferable, ask the user once which doc(s) to use, and suggest they write a `.claude/ship.md` so future runs don't have to ask again.
2. **Gate command.** Same discovery order — explicit config wins. Otherwise infer from what's in the repo: an `.xcodeproj` → `xcodebuild ... build` against a real scheme/destination; a `package.json` with a `build` or `typecheck` script → that script; a `server.js`/`server.cjs` or equivalent dev entrypoint → the project's own run/health-check convention (boots cleanly, page loads, no console errors). If nothing is inferable, ask once.
3. **Reviewer availability.** Check `.claude/agents/` for `code-reviewer.md`, `design-qa.md`, `ux-reviewer.md`. Use whichever exist. If one is missing, skip it — don't fail the loop, just note in the final summary which reviewers didn't run and why. Don't invent reviewer behavior for a missing agent.

## The loop

1. **Orient.** Read whatever subset of the ground-truth doc(s) from step 0 is relevant to this work item. Don't re-read everything for every item — read what the item actually touches.
2. **Implement.** Build the work item directly against that ground truth, following the existing conventions already present in the target code (don't introduce a new stack, library, or pattern without the user asking for it).
3. **Gate:** the gate command from step 0 must pass before requesting review. Don't send broken code to reviewers — that's not what they're for.
4. **Review, in parallel** (single message, one `Agent` tool call per available reviewer):
   - `code-reviewer` — give it the diff (or the specific files touched).
   - `design-qa` — give it the list of changed files and the path to the relevant `DESIGN.md`. It reviews token usage, spacing/sizing consistency, and states directly against that doc, returning structured findings. If the item is layout-heavy enough that static review isn't enough, add a screenshot for extra context.
   - `ux-reviewer` — give it the touched view/component/state files and the work item's intended flow (from the user's spec or the relevant scope/product doc). It works from code-level flow tracing and screenshots, not live interactive automation — don't ask it to drive the app interactively as its primary method, that path is unreliable in most of these environments.
5. **Collect verdicts.**
   - All available reviewers PASS → done. Write a one-paragraph changelog note (what shipped, what any reviewer flagged as a non-blocking note, which reviewers were skipped and why) and stop. Don't ask permission to consider it done — the gate passing *is* the done signal.
   - Any FAIL → revise directly addressing that reviewer's specific numbered notes. Don't guess at unstated preferences; if a reviewer's note is itself unclear, treat it as blocking and either resolve the ambiguity yourself with a clearly-stated judgment call, or ask the user if it's a real fork in direction (not a phrasing nitpick).
6. **Increment the round counter.** Go back to step 3 (re-gate, re-review). **Cap: 5 rounds.**
7. **On cap, or on a genuine taste call surfacing before the cap:** stop. Do not keep iterating blind, and do not just dump raw reviewer notes at the user — summarize each reviewer's verdict and notes yourself in a short memo that separates "what's actually working," "what should change," and "genuinely uncertain — needs a human's eyes." Repo-specific synthesis agents (a taste-synthesizer, a design-critic scoped to a different exploration loop) are not a substitute for this — write the escalation memo directly.

## Judgment the loop deliberately leaves to you

- **Which reviewers actually apply.** A pure data/plumbing change doesn't need `design-qa`. A copy-only change doesn't need `code-reviewer` beyond a glance. Skip what's genuinely irrelevant to the diff — don't run reviewers as theater.
- **When a FAIL is really a note.** A reviewer flagging a hard violation of a written rule (ground-truth-doc token misuse, a real correctness bug) is blocking. A reviewer surfacing a preference not covered by any doc ("not covered by X, flag for human") is not blocking on its own — use judgment on whether it's worth an immediate escalation or a fine call to make yourself.
- **Scope creep.** If implementing one work item reveals a second, unrelated problem, don't silently fix it inside this loop — note it and ask.

## Unattended / headless invocations

If you are running as a single non-interactive invocation (no human watching, no follow-up turn possible — for example, launched by a ticket-queue automation via `claude -p`), the loop above still applies, but: **run every gate/review-triggering command synchronously and wait for it to complete.** Do not background a long-running command (a build, a test suite) expecting to "pick back up" once it finishes — a one-shot invocation has no later turn, so anything backgrounded is simply lost. Do not end your turn until the loop has actually concluded (a real pass or a real cap-out), not merely kicked off.
