# Skills

The agent skills I use every day with Claude Code, by Zachary Walsh. Each one is a folder with a `SKILL.md` and whatever references, scripts and templates it needs.

## Design

| Skill | What it does |
|---|---|
| [logo](skills/logo) | Explores a logo mark in rounds: dozens of numbered vector marks in a grid, each shown beside the wordmark, on an app icon and at small sizes. You pick by number, the next round grows from the picks, and the finished mark exports as SVG, PNG or JPG. Every pick is recorded with its reason. |
| [brainstorm](skills/brainstorm) | Brainstorms a design or product problem as numbered ideas in a `playground/` folder, built in the project's own stack and browsed through one standard viewer. Records each pick and why. |
| [stageshow](skills/stageshow) | Builds faux product UI as stills or animated demos. **By Benji Taylor**, not me. See the note below. |

## Build loop

| Skill | What it does |
|---|---|
| [ship](skills/ship) | Builds one work item, then has it checked by the reviewer agents the repo has, and revises until they pass (five rounds at most). |
| [code-reviewer](skills/code-reviewer) | Reviews a diff against the rules the repo has written down (`DESIGN.md`, `CLAUDE.md`, `AGENTS.md`) and returns pass or fail with file and line. |
| [ticket-planner](skills/ticket-planner) | Breaks a large or vague idea into tickets that can each ship alone. |
| [ticket-queue-init](skills/ticket-queue-init) | Sets up a markdown ticket queue in a repo, with a launchd job that builds each new ticket unattended and opens a draft pull request. macOS only. |

## Memory

| Skill | What it does |
|---|---|
| [brain](skills/brain) | Keeps a `brain/` folder in a repo: product direction, principles, and every decision with its reason. |
| [social-log](skills/social-log) | Writes a plain-language build log entry after every commit, across all my projects. |
| [social-draft](skills/social-draft) | Turns a week of the build log into draft posts. It never posts anything. |

## Install

Clone the repo, then link the skills you want into Claude Code's skills folder:

```sh
ln -s "$(pwd)/skills/logo" ~/.claude/skills/logo
```

Copying the folder works too. A link means a `git pull` updates the skill.

Three skills need more than a link:

- **brain** and **social-log** each use a hook that runs after a commit. See `skills/brain/install.md` and `skills/social-log/install.md`.
- **brainstorm** uses **stageshow** to draw its illustrations, so install both.

Some skills work together but none requires the others: `ship` uses `code-reviewer` when it is installed, `ticket-queue-init` runs tickets through `ship`, and `brainstorm`, `logo` and `ship` read a repo's `brain/` folder when there is one.

## Notes

- **social-log** and **social-draft** are written for my own setup. They name me and expect a build log at `~/sites/personal-projects/social/`. Change both before you use them.
- **stageshow** is an unmodified copy of [benjitaylor/skills](https://github.com/benjitaylor/skills) (`stageshow/`, commit `8020574`, 31 October 2026). It keeps its own `LICENSE` and `NOTICE.md`. For the current version, install it from the source: `npx skills add benjitaylor/skills --skill stageshow`.

## Licence

MIT for everything except `skills/stageshow`, which is MIT under Benji Taylor's copyright. See `LICENSE` and `skills/stageshow/LICENSE`.
