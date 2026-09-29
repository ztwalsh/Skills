---
name: code-reviewer
description: Review a diff against the repo's OWN written ground truth (DESIGN.md, CLAUDE.md, AGENTS.md, PROMPT.md, .claude/ship.md) and return a PASS/FAIL verdict with file:line violations — or install a ship-compatible `.claude/agents/code-reviewer.md` tailored to a repo from its docs. Use when asked to "review this against our conventions", "check this diff against DESIGN.md", "set up a code reviewer for this repo", "add a reviewer agent so ship has a review gate", or when a repo's ship loop has no code-reviewer. Distinct from the built-in /code-review (generic bug hunting): this one judges only against rules the repo has actually written down or visibly follows.
---

# code-reviewer: judge a diff against the repo's own ground truth

A portable reviewer. It never brings an outside style guide. Its authority is
whatever the repo has written down (DESIGN.md, CLAUDE.md, and so on) plus
conventions the code consistently follows. That keeps it useful in any stack,
and keeps it honest: every blocking finding cites a rule a human wrote or a
pattern the repo demonstrably uses.

There are two ways to use it:

- **Review now.** Run the method below on a diff and report the verdict
  yourself, or have a subagent run it so the review is done cold.
- **Install into a repo.** Generate `.claude/agents/code-reviewer.md` from
  `agent-template.md`, tailored to that repo's docs, so the `ship` loop has a
  code-reviewer gate. See "Installing" below.

## The method

1. **Find the ground truth**, in this order, and use everything that exists:
   `.claude/ship.md` or `.claude/ship.config.json` (if it names docs, use
   exactly those), then `DESIGN.md`, `CLAUDE.md`, `AGENTS.md`, `PROMPT.md`,
   `PRODUCT.md` and `README.md` at the repo root or the work item's
   subdirectory. In a repo of sibling sub-projects, use only the docs for the
   sub-project the diff touches. Never blend docs across siblings.
2. **Get the diff.** Use `git diff <base>...HEAD`, the staged or working-tree
   diff, or the specific files you were given. Read each touched file in full
   where the diff alone isn't enough context. A hunk can look fine and still
   duplicate something that already exists elsewhere.
3. **Check, in order:**
   1. **Correctness.** Would this break, throw or misbehave on real input?
      Examples: an unguarded `x[0].y`, a swallowed error, an event listener
      that's never removed, a script that assumes an element exists.
   2. **Written rules.** Does anything violate a rule in the ground-truth
      docs? Quote the rule and name the doc and section.
   3. **Demonstrated conventions.** Does it break a pattern the codebase
      consistently follows (naming, file placement, how components or tokens
      are used)? Only count it if you can point to two or more existing
      examples of the convention.
   4. **Duplication.** Does it re-implement something that already exists as
      a component, helper or token? Name the existing thing.
   5. **Safety.** Secrets, credentials or tokens committed. Any user-supplied
      string interpolated into HTML or a shell command without escaping.
4. **Classify each finding.**
   - **Blocking:** a correctness bug, a violation of a written rule, or a
     secret. Any blocking finding makes the verdict FAIL.
   - **Note:** a demonstrated-convention drift that's minor, a judgment call,
     or something no doc covers. Notes never fail a review on their own.
   - If something looks wrong but no doc or convention backs it, say so:
     "not an established rule here, flag for human." Never present a
     personal preference as law.

## Output format

```
**Verdict:** PASS | FAIL

**Violations**
1. `path/to/file.ext:42` — what's wrong. Rule: "<quoted rule>" (DESIGN.md › Section). Fix: <concrete change>.

**Notes**
1. `path:line` — observation, and why it isn't blocking.

**Checked against:** <the docs actually read>
```

Write "None" under an empty heading. Keep it terse. The builder acts on it
directly.

## Installing into a repo

When asked to set up a reviewer for a repo, or when `ship` finds no
`code-reviewer`:

1. Read the repo's ground-truth docs (step 1 above) and skim its source
   layout.
2. Copy `agent-template.md` (next to this file) to
   `<repo>/.claude/agents/code-reviewer.md`.
3. Fill in the template's placeholders:
   - `{{REPO}}` and `{{STACK}}`: a one-line description of the repo and its
     stack.
   - `{{DOCS}}`: the ground-truth files, in priority order.
   - `{{REPO_CHECKS}}`: a numbered list of concrete, checkable rules taken
     from those docs. Each one says what to grep or look for and cites its
     source section. Only include rules the docs actually state. If the docs
     are thin, keep the list short and rely on the generic method. Don't pad
     it.
   - `{{GATE}}`: the build, test or typecheck command a reviewer can run to
     confirm the diff builds (for example `npm run build`), or "none".
4. **Prove it before calling it done.** Make a deliberately sloppy change that
   breaks two of the repo checks, run the agent on it, and confirm it FAILs
   and cites both. Then run it on a clean recent commit and confirm it PASSes.
   Revert the sloppy change.
5. If the repo has a `ship` skill or loop, it picks up
   `.claude/agents/code-reviewer.md` automatically. Newly added agent files
   may only load in a new Claude Code session. Until then, run the agent's
   prompt through a general-purpose subagent.

## What this does not do

- Visual design judgment (spacing feel, color taste, copy tone). That belongs
  to a `design-qa` or `ux-reviewer` if the repo has one. This reviewer checks
  token and convention *usage* in code, not whether a design looks good.
- Fix anything. It reports, and the builder revises.
- Generic best-practice lecturing. If the repo doesn't care about it, neither
  does this.
