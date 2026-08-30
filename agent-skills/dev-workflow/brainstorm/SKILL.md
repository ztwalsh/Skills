---
description: Generate prototype variants in a test directory's playground from a problem statement, then evaluate and refine them for up to 3 rounds against that directory's own DESIGN.md.
---

# Brainstorm (with evaluation loop)

When this skill is invoked, follow these steps exactly. The user's full input is in `args`.

This skill always operates scoped to one test directory (`test-1`, `test-2`, …) in this repo — never mix ground truth or prototypes across test directories in the same session.

---

## Step 0 — Parse args and load context

**If `args` is empty**, stop and ask:
> "What problem do you want to brainstorm, and which test directory (test-1, test-2, …) is it for? Run `/brainstorm test-2: <problem statement>` or add evaluation criteria with `/brainstorm test-2: <problem> -- <extra criteria>`"

**Determine the target test directory** from the args (an explicit `test-N:` prefix, or infer from conversation context if unambiguous — ask if it's genuinely unclear).

**Split the remaining args on ` -- ` (space-dash-dash-space):**
- Everything before `--` = **problem_statement**
- Everything after `--` (if present) = **extra_criteria** for the evaluator this session
- If no `--` appears, the entire remainder = problem_statement and extra_criteria = ""

**Then read these files before generating anything:**
1. `test-N/DESIGN.md` — visual language, tokens, and interaction patterns for this direction
2. `test-N/PROMPT.md` — functionality/scope, if the problem touches behavior and not just visuals
3. Whatever token source that directory actually uses — inline CSS custom properties in its HTML/CSS (e.g. `test-1`), or a Tailwind config / shadcn theme file (e.g. `test-2` once bootstrapped)

Track the current **round** (starts at 1, max 3).

---

## Step 1 — Generate prototypes

Generate **3–5 distinct directions**. These must be genuinely different interaction models or approaches — not minor variations. Think broadly: one might be a different information density, another a different navigation model, another a radically simplified take.

### Naming

Name each file descriptively using kebab-case, written into that test directory's own playground location: `test-N/playground/<kebab-case-descriptor>.html` (or the equivalent component file if the directory is a React/shadcn setup — match whatever that directory's stack actually uses).

Examples: `test-1/playground/dense-table-view.html`, `test-2/playground/card-first-dashboard.html`

### Each prototype must:

1. **Be a single self-contained file** where the directory's stack allows it (a standalone HTML file for a plain-HTML directory like `test-1`; a self-contained component for a React directory like `test-2`). No external JS libraries or CDN imports beyond what that directory already depends on (e.g. shadcn/Tailwind already in use).

2. **Reference that directory's actual design tokens**, not a copy-pasted or invented set:
   - Plain HTML/CSS directories: link/inherit the same token source the rest of the directory uses (e.g. the `:root` custom properties already defined in `test-1`'s stylesheet) — don't fork a duplicate token block.
   - React/shadcn directories: use the existing Tailwind/shadcn theme values already configured for that directory.

3. **Use tokens for all design values.** Never hardcode colors, spacing, font sizes, or border radii that duplicate an existing token.

4. **Include a title/label** that names the prototype clearly (a `<title>` tag, or equivalent visible label).

5. **Match the target form factor already established for that directory** (desktop dashboard viewport, unless the directory's `DESIGN.md` says otherwise).

6. **Focus on the specific interaction or flow being explored**, not pixel-perfect fidelity to the eventual final screen.

7. **Be interactive enough to click/tab through the key moment.** The primary interaction must actually work, not just be implied by a static mock.

8. **Include a subtle header/back-link bar** so it's navigable back to a gallery/index if one exists in that directory's playground; style it subtly — small, low-contrast, out of the way of the actual prototype content.

9. **Stay reasonably short** — a focused prototype demonstrating one direction, not a full app rebuild.

10. **Include a direction comment near the top** (an HTML comment, or a code comment at the top of the component): one or two sentences on the interaction model or structural bet this prototype explores.

### Interaction rules

- All interactions must work on click/tap, not hover-only.
- Animations and transitions are encouraged when they are the point of the direction being explored.

Write all prototype files. **Do not update any manifest/index file yet** — only do that after the final round.

---

## Step 2 — Evaluate (brainstorm-eval agent)

Use the **Agent tool** to spawn a `brainstorm-eval` subagent. This agent runs on Opus and evaluates against that test directory's `DESIGN.md` plus modern design standards.

Pass it this prompt (fill in the actual values):

```
Evaluate these prototypes for a visual-design-test brainstorm session.

Test directory: <test-N>
DESIGN.md path: <absolute path to test-N/DESIGN.md>
Round: <round number>
Problem statement: <problem_statement>
Extra criteria: <extra_criteria, or "none">

Prototype files to evaluate:
<list each absolute path, one per line>

Return only the JSON object as specified in your instructions.
```

Wait for the agent's response. Parse the JSON it returns.

---

## Step 3 — Loop decision

After receiving the evaluation JSON:

**If ALL prototypes have `"pass": true` OR this is round 3:**
- Proceed to Step 4.

**Otherwise:**
- For each prototype where `"pass": false`, apply the `revision_prompt` by editing the file in place. Make targeted changes — do not rewrite the entire prototype.
- Increment the round counter.
- Tell the user: "Round <N> eval complete — <X> prototypes revised. Running round <N+1>…"
- Return to Step 2.

---

## Step 4 — Update the manifest/index (if that test directory has one)

If `test-N/playground/` already has a manifest or index file convention, follow it — append a new session entry, preserving all prior sessions, without inventing a new format. If no such convention exists yet in that directory, skip this step (don't invent scaffolding the user hasn't asked for).

---

## Step 5 — Report back

After writing all files (and the manifest, if applicable), report:

1. A list of each prototype with its filename, final score, and one-sentence description.
2. The evaluator's `overall` summary (from the final round JSON).
3. How many rounds it took and a brief note on what changed between rounds (if >1).
4. How to view the prototypes (whatever that directory's actual serve command is — e.g. `node server.js` for `test-1`, or the dev server command for `test-2`).
5. An invitation to iterate: "To refine a direction, tell me which one and what to change."

---

## Iteration (after initial session completes)

If the user responds with feedback on a specific prototype (e.g. "refine direction 2 — make the density lighter"):

1. Read the existing prototype file.
2. Edit it in place to incorporate the feedback.
3. Do NOT update the manifest/index.
4. Do NOT run the evaluation loop again unless the user asks for it.
5. Report a brief summary of what changed and why.

---

## Quality checklist (verify before writing each file)

- [ ] Scoped to exactly one test directory — no cross-directory token or content bleed
- [ ] Self-contained per that directory's own stack conventions
- [ ] All colors, spacing, type sizes reference that directory's actual existing tokens
- [ ] Title/label present
- [ ] Direction comment at top of file
- [ ] Primary interaction works on click/tap
- [ ] Genuinely distinct from the other directions in this session
