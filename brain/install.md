# Installing the brain skill

## The skill

Link the folder into Claude Code's skills directory:

```bash
ln -s /path/to/skills-repo/brain ~/.claude/skills/brain
```

## The commit-time check (optional, recommended)

`hooks/post-commit-decisions.sh` runs after every `git commit` Claude makes. In a repo that has
`brain/decisions/`, it asks Claude to check whether the committed work included a decision or
insight that is not in `brain/` yet, and to log it. It stays silent in repos without a `brain/`,
and for commits that only touch `brain/` or `CLAUDE.md`.

Add it to `~/.claude/settings.json` beside any existing `PostToolUse` hooks for `Bash`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/skills-repo/brain/hooks/post-commit-decisions.sh",
            "timeout": 10,
            "statusMessage": "Checking for unlogged decisions"
          }
        ]
      }
    ]
  }
}
```

What it cannot do: it cannot tell what counts as a decision. It makes the agent look every
time; the agent still judges. Run the skill's review job now and then to catch what was missed.

It looks for the committed repo in the session's working directory, then in
`~/sites/personal-projects` one and two levels deep. Set `BRAIN_HOOK_ROOT` to use another folder.
