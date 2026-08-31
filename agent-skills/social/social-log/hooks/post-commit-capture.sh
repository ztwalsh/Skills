#!/usr/bin/env bash
# Claude Code PostToolUse hook (matcher: Bash).
# After a successful `git commit` in any personal project, append a stub entry to
# the shared BUILD-LOG.md and nudge Claude to enrich it while session context is
# still warm. Fast no-op for every other Bash call.
#
# Resolving which repo was committed to:
#   1. the hook payload's cwd (the common case), then
#   2. a fallback scan of every repo under ~/sites/personal-projects for one
#      whose HEAD moved in the last 90s. This catches `cd other-repo && git
#      commit` compound commands (the payload cwd is stale for those) and
#      commits typed in a bare terminal via the optional git post-commit hook.
#
# Wire-up: see ../install.md
set -uo pipefail

# SOCIAL_LOG_ROOT override exists only so the test harness can point the whole
# thing at a scratch tree; unset in normal use.
ROOT="${SOCIAL_LOG_ROOT:-$HOME/sites/personal-projects}"
SOCIAL_DIR="$ROOT/social"
LOG="$SOCIAL_DIR/BUILD-LOG.md"
CONFIG="$SOCIAL_DIR/config.json"
MARKER="<!-- entries below -->"
FRESH_SECS=90

payload=$(cat)

# --- fast path: bail unless this looks like a git commit ----------------------
printf '%s' "$payload" | grep -q 'git commit' || exit 0
[ -d "$SOCIAL_DIR" ] || exit 0
[ -f "$LOG" ] || exit 0
command -v git >/dev/null 2>&1 || exit 0

# --- parse the hook payload (jq, python3 fallback) ---------------------------
if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')
  cwd=$(printf '%s' "$payload" | jq -r '.cwd // ""')
else
  cmd=$(printf '%s' "$payload" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || echo "")
  cwd=$(printf '%s' "$payload" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("cwd",""))' 2>/dev/null || echo "")
fi

case "$cmd" in
  *"git commit"*) : ;;
  *) exit 0 ;;
esac

now=$(date +%s)
social_real=$(cd "$SOCIAL_DIR" 2>/dev/null && pwd -P) || social_real="$SOCIAL_DIR"
logged=""   # accumulates "<sha> in <project>" lines for the nudge
seen=""     # toplevels already handled this invocation

# Append a stub for one repo if its HEAD is fresh, visible, and not already
# logged. Populates $logged on success. Safe to call with any path.
process_repo() {
  repo=$1
  toplevel=$(git -C "$repo" rev-parse --show-toplevel 2>/dev/null) || return 0
  # normalise (git resolves symlinks; a raw path like /var -> /private/var on
  # macOS otherwise wouldn't match SOCIAL_DIR)
  toplevel=$(cd "$toplevel" 2>/dev/null && pwd -P) || return 0
  case " $seen " in *" $toplevel "*) return 0 ;; esac
  seen="$seen $toplevel"

  # never log the social repo's own commits
  [ "$toplevel" = "$social_real" ] && return 0

  last_commit_epoch=$(git -C "$toplevel" log -1 --format=%ct 2>/dev/null) || return 0
  [ $((now - last_commit_epoch)) -le "$FRESH_SECS" ] || return 0

  project=$(basename "$toplevel")

  if [ -f "$CONFIG" ] && command -v jq >/dev/null 2>&1; then
    vis=$(jq -r --arg p "$project" '.projects[$p] // "public"' "$CONFIG" 2>/dev/null || echo "public")
    [ "$vis" = "private" ] && return 0
  fi

  sha=$(git -C "$toplevel" rev-parse --short HEAD 2>/dev/null) || return 0
  grep -q "· ${sha}\$" "$LOG" 2>/dev/null && return 0   # already logged (dedupe)
  grep -q "· ${sha} " "$LOG" 2>/dev/null && return 0

  subject=$(git -C "$toplevel" log -1 --format=%s)
  ts=$(git -C "$toplevel" log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M')
  stat=$(git -C "$toplevel" show --stat --format='' HEAD | tail -n 1 | sed 's/^[[:space:]]*//')
  branch=$(git -C "$toplevel" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  [ "$branch" = "HEAD" ] && branch=""

  # prepend below the marker (newest first). BSD awk can't take a multi-line -v,
  # so stage the block in a file and let `sed r` splice it in after the marker.
  stubfile=$(mktemp)
  {
    printf '\n## %s · %s · %s\n' "$ts" "$project" "$sha"
    printf '**What:** %s\n' "$subject"
    printf '**Why it matters:** _(stub — enrich me)_\n'
    printf '**Shareable:** ?\n'
    printf '**Tags:**\n'
    printf '_%s' "$stat"
    [ -n "$branch" ] && printf ' · branch `%s`' "$branch"
    printf '_\n'
    printf 'status: stub\n'
  } > "$stubfile"

  tmp=$(mktemp)
  sed "/$MARKER/r $stubfile" "$LOG" > "$tmp" && mv "$tmp" "$LOG"
  rm -f "$stubfile"

  logged="${logged}${sha} in ${project} (${ts})\n"
}

# 1. the repo the payload says we were in
[ -n "${cwd:-}" ] && process_repo "$cwd"

# 2. fallback: any personal-projects repo whose HEAD moved just now
if [ -d "$ROOT" ]; then
  for d in "$ROOT"/*/; do
    [ -e "$d/.git" ] || continue
    process_repo "$d"
  done
fi

[ -z "$logged" ] && exit 0

# nudge Claude to enrich (additionalContext is injected back into the session)
nudge=$(printf '%b' "$logged" | sed 's/"/\\"/g' | paste -sd '; ' -)
cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"New commit stub(s) added to the top of ~/sites/personal-projects/social/BUILD-LOG.md: ${nudge}. Per the social-log skill: rewrite each stub into an enriched entry (plain-language What, a real Why it matters for a reader without the repo open, Shareable yes/no + what to capture, Tags), set status: enriched, and merge any sibling stubs from the same unit of work. For each entry marked Shareable: yes, create assets/<date>-<project>-<slug>/SHOT-LIST.md."}}
EOF
exit 0
