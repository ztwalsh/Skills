#!/usr/bin/env bash
# Claude Code PostToolUse hook (matcher: Bash).
# After a `git commit` in a repo that has a brain/ folder, ask Claude to check
# whether the committed work included a decision that is not in brain/ yet.
# The hook cannot tell what counts as a decision; it only makes the agent look,
# every time. Fast no-op for every other Bash call, for repos without brain/,
# and for commits that only touch brain/ itself (so logging never loops).
#
# Wire-up: see ../install.md
set -uo pipefail

# BRAIN_HOOK_ROOT / BRAIN_HOOK_STATE exist only so tests can use a scratch tree.
ROOT="${BRAIN_HOOK_ROOT:-$HOME/sites/personal-projects}"
STATE="${BRAIN_HOOK_STATE:-$HOME/.claude/brain-hook-seen}"
FRESH_SECS=90

payload=$(cat)
printf '%s' "$payload" | grep -q 'git commit' || exit 0
command -v git >/dev/null 2>&1 || exit 0

if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')
  cwd=$(printf '%s' "$payload" | jq -r '.cwd // ""')
else
  cmd=$(printf '%s' "$payload" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || echo "")
  cwd=$(printf '%s' "$payload" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("cwd",""))' 2>/dev/null || echo "")
fi
case "$cmd" in *"git commit"*) : ;; *) exit 0 ;; esac

now=$(date +%s)
found=""
seen=""

check_repo() {
  top=$(git -C "$1" rev-parse --show-toplevel 2>/dev/null) || return 0
  top=$(cd "$top" 2>/dev/null && pwd -P) || return 0
  case " $seen " in *" $top "*) return 0 ;; esac
  seen="$seen $top"
  [ -d "$top/brain/decisions" ] || return 0

  epoch=$(git -C "$top" log -1 --format=%ct 2>/dev/null) || return 0
  [ $((now - epoch)) -le "$FRESH_SECS" ] || return 0

  sha=$(git -C "$top" rev-parse --short HEAD 2>/dev/null) || return 0
  grep -qsxF "$top $sha" "$STATE" && return 0

  # a commit that only touches brain/ or CLAUDE.md is the logging itself
  other=$(git -C "$top" show --name-only --format= HEAD 2>/dev/null | grep -v -E '^(brain/|CLAUDE\.md$|AGENTS\.md$)' | head -1)
  [ -n "$other" ] || return 0

  mkdir -p "$(dirname "$STATE")" 2>/dev/null
  echo "$top $sha" >> "$STATE" 2>/dev/null
  # keep the state file small
  if [ "$(wc -l < "$STATE" 2>/dev/null || echo 0)" -gt 400 ]; then
    tail -200 "$STATE" > "$STATE.tmp" 2>/dev/null && mv "$STATE.tmp" "$STATE"
  fi
  found="${found}${sha} in $(basename "$top"); "
}

[ -n "${cwd:-}" ] && check_repo "$cwd"
if [ -d "$ROOT" ]; then
  for d in "$ROOT"/*/ "$ROOT"/*/*/; do
    [ -e "$d/.git" ] || continue
    check_repo "$d"
  done
fi

[ -z "$found" ] && exit 0
found=$(printf '%s' "$found" | sed 's/"/\\"/g; s/; $//')
printf '%s\n' "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"Commit ${found}: this repo has a brain/ folder. Before finishing, check whether the work in this commit, or anything the user said while it was being done, included a product or design decision that is not yet in brain/decisions/ (a choice between options, a rule set or removed, a direction picked or dropped) or an insight for brain/insights.md. If so, log it now with the brain skill: the user's words quoted exactly, 'No reason given.' when they gave none, filed under the right area. Tell the user in one line what you logged. If there was nothing to log, do nothing and say nothing about this check. Routine fixes, refactors and build changes are not decisions.\"}}"
exit 0
