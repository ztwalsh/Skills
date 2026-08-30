# Install / wire-up

One-time setup. After this, the build log fills itself in from every commit in
every personal project, no per-repo steps.

## 1. Prerequisites

- `jq` (`brew install jq`) — the hook has a `python3` fallback but jq is cleaner.
- The data repo at `~/sites/personal-projects/social/` (already scaffolded:
  `BUILD-LOG.md`, `voice.md`, `config.json`, `assets/`, `drafts/`, `posted/`).

## 2. Symlink the skills so they're live in every project

```sh
ln -s ~/sites/personal-projects/Skills/agent-skills/social/social-log   ~/.claude/skills/social-log
ln -s ~/sites/personal-projects/Skills/agent-skills/social/social-draft ~/.claude/skills/social-draft
```

(Matches how `ship`, `brainstorm`, etc. are already linked.)

## 3. Register the PostToolUse hook

Add to `~/.claude/settings.json` (global, so it covers every project):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/zacharywalsh/sites/personal-projects/Skills/agent-skills/social/social-log/hooks/post-commit-capture.sh"
          }
        ]
      }
    ]
  }
}
```

Use the absolute path (some Claude Code versions don't expand `$HOME` in hook
commands). Merge into any existing `hooks` block rather than replacing it. The
`update-config` skill can apply this correctly against the current schema —
prefer it over hand-editing. Restart / reload the session so the hook registers.

The script is a fast no-op on every Bash call that isn't a `git commit`, and it
guards on: social dir exists, repo isn't the `social` repo, commit happened in
the last 90s, project isn't `private` in `config.json`, SHA not already logged.

## 4. Verify

```sh
cd ~/sites/personal-projects/assistantOS
git commit --allow-empty -m "test: social-log hook"
```

`~/sites/personal-projects/social/BUILD-LOG.md` should gain a `status: stub`
block, and in a Claude session you should see a nudge to enrich it. Delete the
test entry and the empty commit afterward:

```sh
git reset --hard HEAD~1
```

## 5. (Optional) catch manual commits too

The PostToolUse hook only sees commits made *through* Claude Code (which is
almost all of them, including unattended `ticket-queue` runs). To also log
commits typed in a bare terminal, add a git `post-commit` hook globally:

```sh
mkdir -p ~/.config/git/hooks
cat > ~/.config/git/hooks/post-commit <<'EOF'
#!/usr/bin/env bash
printf '{"tool_input":{"command":"git commit"},"cwd":"%s"}' "$PWD" \
  | ~/sites/personal-projects/Skills/agent-skills/social/social-log/hooks/post-commit-capture.sh >/dev/null 2>&1 || true
EOF
chmod +x ~/.config/git/hooks/post-commit
git config --global core.hooksPath ~/.config/git/hooks
```

Caveat: `core.hooksPath` is global — if any repo has its own `.git/hooks`
scripts you rely on, move them into `~/.config/git/hooks` too. `social-draft`
already sweeps `git log` across all repos as a backstop, so this step is
genuinely optional.

## 6. Later: schedule the weekly draft

Once the log has a few weeks in it, use the `schedule` skill to run
`/social-draft` every Friday morning and push a notification. Start on-demand.
