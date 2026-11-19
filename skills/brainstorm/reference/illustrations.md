# Illustrations

Every idea gets one square illustration, made with the **Stageshow** skill. It is the idea's
thumbnail everywhere in the playground. It is an illustration of the idea, not a screenshot of
it: direct screenshots come out at the wrong scale and shape, and a thumbnail has one job, which
is to let someone tell this idea from the one beside it at a glance.

## What to make

- **A still, not an animation.** One frame.
- **Square.** Design the stage at 720 × 720 and export at 2x: `thumb.png` is 1440 × 1440.
- **One idea, one focal point.** Show the part of the idea that makes it different from the
  others in the pass, cropped in on it. Five thumbnails of five whole pages look the same.
- **In the project's own look.** The illustration shows the idea, so it uses the host project's
  tokens, type and components, mapped as Stageshow's `references/looks.md` describes. It does
  not use the playground shell's look.
- **On the shell's ground.** The frame's background is the shell's dark ground (`--paper` in
  `playground/shell-tokens.css`), so thumbnails sit in the grid without a box around them. If the
  project's UI is light, the light surface sits inside the frame as a window or panel.
- **Consistent across a pass.** Same stage size, same ground, same crop logic, same fidelity for
  every idea in the pass, so the differences seen are differences between the ideas.
- **No invented content that looks real.** No real user data, names or private content.

For an idea that is not a screen (a name, a tagline, a mark, a strategy), make a typographic or
diagram still with the same frame rules, rather than forcing fake UI.

## How to make it

Invoke the `stageshow` skill and follow its workflow for a still (medium and place, look, start
from the closest gold example, frame, rehearse). Its skill folder holds the kit, the examples
and the filming script. It is normally at
`/path/to/skills-repo/skills/stageshow`; if it is not there, find it with
the Skill tool's base directory for `stageshow`.

Where to build the stage depends on the host project:

| Host project | Build the stage | Film it |
|---|---|---|
| React, with the Stageshow kit already in the repo | In the idea's folder (`illustration/`), importing the repo's kit | Through the project's own dev server, with Stageshow's `scripts/film.mjs --still` |
| React, without the kit | Same, after copying the kit in as Stageshow's skill describes, if the user agrees to adding it | Same |
| Anything else (Swift, plain HTML, no web stack) | In the Stageshow skill folder as `examples/pg-<slug>-<id>/`, where its preview picks it up | Stageshow's own preview (`npm run dev` there) and `scripts/film.mjs "<preview>/?capture=pg-<slug>-<id>" --select '#example' --still --out <thumb path>` |

For the last row:

- The Stageshow folder needs its dependencies installed once (`npm install` inside it). Ask the
  user before running it the first time.
- When the still is filmed, **move the stage's source into the idea's folder** as
  `illustration/` and delete `examples/pg-<slug>-<id>/` from the Stageshow folder. The skill
  folder is shared; do not leave project work in it.

Save the result as `thumb.png` in the idea's folder, and set the idea's `thumb` in
`brainstorm.json`.

## Check before moving on

Open the pass in the playground's grid view and look at the thumbnails together:

- Can each idea be told from the others at card size?
- Does any thumbnail look boxed, empty or clipped beside the rest?
- Is anything real-looking that should not be (a person's name, an address)?

Fix the worst one first. Stageshow's own rehearsal gate applies to each still.

## When Stageshow cannot be used

If the skill is missing, or the user declines the install, do not substitute screenshots. Leave
`thumb` unset: the shell shows a typographic tile with the idea's number and name. Say in the
report that illustrations were skipped and why.
