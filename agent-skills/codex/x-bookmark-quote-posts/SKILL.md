---
name: x-bookmark-quote-posts
description: Check Meng's latest 30 days of X/Twitter bookmarks and turn recent saved posts into source-backed quote-post drafts in the Content repo. Use when asked to review X bookmarks, create quote posts from bookmarks, refresh the bookmark quote queue, run the bookmark quote automation, or write personal founder/designer/operator quote posts from X sources.
---

# X Bookmark Quote Posts

## Overview

Turn Meng's latest X bookmarks into a dated quote-post queue. The output should feel like Meng thinking in public from lived experience, not like generic AI commentary.

## Start

Work from `/Users/mengto/Downloads/Projects/Content` unless the user names another content repo.

Before collecting:

- Read `AGENTS.md`, if present or supplied in the prompt.
- Check `git status --short` early. The Content repo is often dirty; keep changes scoped.
- Read the latest existing `data/x-growth/bookmark-quote-posts/*.md` file as the voice sample when one exists.
- Use the Codex in-app browser only for X. Do not use Chrome.
- Do not post, reply, quote, like, retweet, DM, follow, or mutate X in any way.

If X is logged out, CAPTCHA-blocked, or the in-app browser cannot attach, stop and report the exact blocker. Ask Meng to sign in only when the browser session requires it.

## Collect Bookmarks

Open:

```text
https://x.com/i/bookmarks
```

Collect a bounded batch from the latest visible bookmark feed:

- Extract author, handle, source URL, source timestamp, visible post text, article-card title/summary, and media/context clues.
- Default to the last 30 days of bookmark-feed source posts unless the user names a different window. Treat the current date/time and timezone literally.
- Scroll enough to gather about 12-20 usable candidates across the 30-day window, while staying bounded.
- Include practical resource-list bookmarks, not only AI-agent takes. Example pattern: a Solt Wagner-style list of creative resources, websites, and apps such as image generators, dither tools, mockup tools, Framer templates, dock widgets, motion tools, and gradient tools.
- Note that X usually exposes source post timestamps, not bookmark-saved timestamps. Label the window clearly as source-post dates from the bookmark feed unless the saved/bookmarked timestamp is visible.
- Open status URLs for truncated posts or article cards when needed to get enough context. Keep the collection source-backed.

Do not rely on public search when the task is specifically about bookmarks unless browser access is blocked and the user approves a fallback.

## Draft

Create or update:

```text
data/x-growth/bookmark-quote-posts/YYYY-MM-DD.md
```

Use this shape:

```markdown
# Bookmark Quote Posts - YYYY-MM-DD

Checked in Codex Browser: https://x.com/i/bookmarks

Window: ...

Tone pass: first-person, founder/designer/operator voice. Two or three slightly longer paragraphs, closer to a lived-in note than a stack of punchlines.

## Best Picks

### 1. Source Name - Topic

Source: https://x.com/...

<draft>
```

Write 7-10 drafts unless the source supply is weaker. Put strongest posts under `Best Picks`; use `Secondary Picks` for alternates or lower-confidence sources. Prefer variety across agents, design resources, tools, founder lessons, AI video, product demos, and workflow ideas.

## Voice

Write like Meng with more experience in the sentence than polish.

Use:

- first person when it naturally fits
- two or three slightly longer paragraphs per draft
- direct language, rough edges, and human specificity
- past experience from building, designing, teaching, shipping, renaming, debugging, and getting burned
- honest uncertainty when the source is thin

Avoid:

- short sentence, blank line, short sentence, blank line cadence
- generic frameworks like "the real skill is..."
- empty agreement such as "great point"
- hype phrases such as "game changer", "unlock", "hot take", "supercharge"
- CTAs unless the user asks for them
- claims about Meng's life that are not grounded in the current prompt, existing drafts, or known repo/product context

Good drafts should sound like a founder/designer adding personal context to the source, not summarizing it.

## Verify

Before committing:

- Ensure every draft has a source URL.
- Ensure every final draft is two or three paragraphs unless there is a deliberate exception.
- Re-read the file aloud mentally and remove AI-sounding summary lines.
- Run `git diff --check -- data/x-growth/bookmark-quote-posts/YYYY-MM-DD.md`.
- Stage only the intended bookmark quote-post file.

Commit from the Content repo when the run changes files. Use a message like:

```bash
git commit -m "Refresh X bookmark quote posts for YYYY-MM-DD"
```

If no file changed because browser access was blocked or no usable bookmarks were available, do not invent a commit; report the blocker or no-change state plainly.

## Report

Close with:

- output path
- candidate/source count
- time window used
- browser/access status
- validation result
- commit hash, when committed
