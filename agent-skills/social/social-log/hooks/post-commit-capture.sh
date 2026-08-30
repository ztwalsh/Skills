#!/usr/bin/env bash
# Claude Code PostToolUse hook (matcher: Bash).
# After a successful `git commit` in any personal project, append a stub entry to
# the shared BUILD-LOG.md and nudge Claude to enrich it while session context is
# still warm. Fast no-op for every other Bash call.
#
# Wire-up: see ../install.md
set -uo pipefail

SOCIAL_DIR="$HOME/sites/personal-projects/social"
LOG="$SOCIAL_DIR/BUILD-LOG.md"
CONFIG="$SOCIAL_DIR/config.json"
MARKER="<!-- entries below -->"

payload=$(cat)

# --- fast path: bail unless this looks like a git commit -----------------------
printf '%s' "$payload" | grep -q 'git commit' || exit 0
[ -d "$SOCIAL_DIR" ] || exit 0
[ -f "$LOG" ] || exit 0

# --- parse the hook payload (jq, python3 fallback) ----------------------------
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

cd "${cwd:-$PWD}" 2>/dev/null || exit 0
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
project=$(basename "$toplevel")

# never log the social repo's own commits
[ "$toplevel" = "$SOCIAL_DIR" ] && exit 0

# --- confirm HEAD actually moved (commit within the last 90s) -----------------
last_commit_epoch=$(git log -1 --format=%ct 2>/dev/null) || exit 0
now=$(date +%s)
[ $((now - last_commit_epoch)) -le 90 ] || exit 0

# --- per-project visibility --------------------------------------------------
if [ -f "$CONFIG" ] && command -v jq >/dev/null 2>&1; then
  vis=$(jq -r --arg p "$project" '.projects[$p] // "public"' "$CONFIG" 2>/dev/null || echo "public")
  [ "$vis" = "private" ] && exit 0
fi

sha=$(git rev-parse --short HEAD 2>/dev/null) || exit 0
grep -q "· ${sha}\$" "$LOG" 2>/dev/null && exit 0   # already logged (dedupe)
grep -q "· ${sha} " "$LOG" 2>/dev/null && exit 0

subject=$(git log -1 --format=%s)
ts=$(git log -1 --format=%cd --date=format:'%Y-%m-%d %H:%M')
stat=$(git show --stat --format='' HEAD | tail -n 1 | sed 's/^[[:space:]]*//')
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
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

# nudge Claude to enrich (additionalContext is injected back into the session)
esc_project=${project//\"/\\\"}
cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Committed ${sha} in ${esc_project}. A stub was just added to the top of ~/sites/personal-projects/social/BUILD-LOG.md. Per the social-log skill: rewrite that stub into an enriched entry (plain-language What, a real Why it matters for a reader without the repo open, Shareable yes/no + what to capture, Tags), set status: enriched, and merge any sibling stubs from this same unit of work into one entry. If Shareable is yes, create assets/${ts%% *}-${esc_project}-<slug>/SHOT-LIST.md."}}
EOF
exit 0
