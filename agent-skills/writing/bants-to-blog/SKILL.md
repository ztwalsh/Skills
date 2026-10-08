---
name: bants-to-blog
description: "Turn one topic from a meeting conversation (Granola, pasted transcript, or notes) into a polished internal blog post, enriched with researched and hyperlinked external concepts, published as an editable document in Zach's Sidekick space so it can be shared for co-editing. Use when Zach says 'bants to blog', 'turn this meeting into a blog post', 'write up that discussion', 'blog this', or shares a transcript and wants an internal write-up — even if he doesn't say 'blog' explicitly."
---

# Bants to Blog

Turn one topic from a meeting — the bants — into an internal post a colleague who wasn't there can read in a few minutes and learn something from.

Two ideas drive the whole skill:

**Meetings wander across many topics; a good post covers one.** So work topic-first. Zach picks the topic, and you mine the transcript only for what serves it. Never summarize the whole meeting.

**People reference outside ideas loosely, from memory.** So research what they mention, verify it, and link it. That's what makes the post credible and lets readers go deeper.

## Not to be confused with `process-transcript`

`process-transcript` files the whole meeting as notes plus a verbatim transcript, for Zach's own recall. **This skill extracts one thread and turns it into something other people read.** Different output, different audience. Running both on the same meeting is fine and often right.

---

## 1. Find the source

| Zach gives you | Do this |
|---|---|
| A meeting or person ("my meeting with Stephen") | Find it via the `user-Granola` MCP — `list_meetings`, `query_granola_meetings`, `get_meetings`. Match names loosely; calendars spell them inconsistently. |
| A Granola URL or UUID | Use the UUID directly with `get_meeting_transcript`. |
| A pasted transcript or notes | Use what he pasted. Don't go looking. |

If several meetings match, show a short table and confirm which one before going further.

## 2. Ask for the topic — always, before writing

Skim the meeting first: the summary, notes, or a fast pass over the transcript. Then use `AskQuestion` to offer **3–4 candidate topics you actually saw**, with "Other" available.

Don't proceed until a topic is chosen. The post's entire shape depends on it, and guessing wastes the draft.

Zach may combine topics. That's fine.

## 3. Mine the transcript for that topic only

Work iteratively, back and forth — not one read-through followed by a summary.

1. Search the transcript using the topic plus related keywords and synonyms.
2. For each hit, read the surrounding context. Capture the question that prompted it, the reasoning, and any pushback or resolution.
3. **Loop.** Topics get revisited later in a meeting. Search again using new terms you picked up, until nothing new turns up.
4. Keep a running list of excerpts with who said them.

Discard everything unrelated — other topics, small talk, scheduling.

**Only the collected excerpts feed the post.** If the topic turns out to be thin or absent, say so and offer alternatives. Never pad.

## 4. Research the external concepts and link them

While mining, note every external concept, framework, model, book, company practice, term, or person the speakers mention — a management model like single-threaded leadership, RACI, the 5 Whys, a named methodology, a poem.

For each one relevant to the chosen topic:

- **Search for the best source** with `WebSearch`. Prefer primary and authoritative sources — the originating company's own docs or blog, Wikipedia, official documentation, respected publications — over content farms, forums, and aggregators. Restricting to a trusted domain helps when first results are weak.
- **Verify the source actually supports the claim.** Speakers paraphrase and misremember constantly. If the transcript's version differs from the source on names, origins, or details, **write what's accurate and tell Zach about the discrepancy.**
- **Link at first mention**, in `[text](url)` form, with a sentence or two of explanation where readers won't know it.
- **Never link a URL you didn't see in search results.** Don't link anything you couldn't verify. If attribution is disputed, say so or leave it out.

Keep links purposeful — **typically 3–6 per post.**

**Then make recommendations.** After drafting, tell Zach about useful things you found that the speakers didn't mention: a related framework, a strong counterargument, an article worth citing. Let him choose. Don't silently pad the post with them.

## 5. Write the post

**Audience:** Zapier colleagues with general context but none of this meeting's details.

**Voice:** Apply `writing-without-bullshit`. Front-load the conclusion, take a position, active voice, concrete nouns and real numbers, no corporate filler. Conversational but not chatty.

**Length:** 400–800 words unless the content demands more.

### Default structure

Adapt the headings to the content — these are a starting point, not a template to fill.

```markdown
# [Specific, informative title]

*[One-line TL;DR]*

## Background
Why this came up. Just enough context.

## What we discussed
The core story, organized by idea rather than chronology, with external concepts linked.

## Why it matters
Implications for the team or the company.

## Next steps
Owners and dates if the meeting stated them, otherwise an invitation to comment.
```

### Guidelines

- Write in **first person** when Zach is the author. Credit co-authors he names.
- **Attribute ideas to people by name** when they said so. Paraphrase; use short direct quotes only when genuinely quotable.
- **Never invent facts, numbers, owners, or decisions.** If something's ambiguous, leave it out or flag it.
- **Flag anything sensitive** — HR and personnel matters, candid criticism of teams or individuals, customer names, financials, unannounced plans, profanity. Soften or omit by default, and tell Zach what you changed so he can put it back.

## 6. Publish to Sidekick

Sidekick is the source of truth. Publish there rather than leaving the draft on the local machine.

### Where it goes — ask the first time

`/Mine/AGENTS.md` and `/Mine/README.md` are explicit: **never create a new top-level folder without asking.** So on the first run, propose the destination and let Zach pick:

- `/Mine/blog-posts/` — a new top-level folder, needs his okay
- `/Mine/initiatives/<project>/` — when the post is tied to active project work
- `/Mine/brain/topics/<domain>/` — the README's default for knowledge content with unclear project affiliation

Once a home is established, use it and stop asking.

**Filename:** `YYYY-MM-DD-short-slug.md`, using the **meeting date**, per the space naming convention.

### Writing the file

Use the `user-sidekick` MCP `write` tool for new files and `edit` for later changes. Start with frontmatter:

```yaml
---
title: "<post title>"
content_type: blog-draft
summary: "<one line>"
source_meeting: "<meeting title, date>"
status: draft
created_by: "Zach Walsh"
created_at: YYYY-MM-DD
last_updated_at: YYYY-MM-DD
---
```

If you created a new folder, add an `index.md` to it — frontmatter plus a one-line description — and append a one-line entry for each new post.

### Two required follow-ups

1. **Re-read the file** after writing to confirm the content and links came through intact.
2. **Log it.** `/Mine/AGENTS.md` requires a row prepended to `brain/activity-log/YYYY.md` for every new file:
   ```
   | YYYY-MM-DD | Document Title | /Mine/path/to/file.md | new |
   ```

## 7. Share for editing

Only when Zach names someone ("share it with Steven").

- **Resolve the person with `lookup_users`.** Never guess user IDs. If several match, confirm which one.
- **Grant access with `share_file`** — `role: "editor"` for co-authors and reviewers who should change the text, `viewer` if they only need to read.
- **Confirm the recipient and role before granting**, unless Zach already stated both. Sharing is outward-facing and hard to take back.
- **Optionally notify** with `send_to_inbox` linking the file. Sharing alone doesn't tell them.

If he didn't name anyone, don't share. Offer to.

## 8. Report back

Keep it short. Cover:

- The topic covered
- The Sidekick path of the published draft
- What you linked, and **any discrepancies** between what was said and what the sources say
- What you softened or left out
- Who it was shared with, if anyone
- Your recommended additions

**Don't paste the whole post into chat.** Offer at most one follow-up — tone, length, sharing, or another topic from the same meeting.

---

## Pitfalls

- **Summarizing the meeting instead of the topic.** The most common failure. If the draft has a section for every agenda item, start over.
- **Writing before asking for the topic.** Step 2 is not optional.
- **Reading the transcript once.** Topics resurface late. Loop until searches stop returning new material.
- **Linking from memory.** If you didn't see the URL in search results, don't use it.
- **Repeating a speaker's misattribution** because it sounded right. Verify, then correct and flag.
- **Padding a thin topic.** Say it's thin and offer alternatives.
- **Creating `/Mine/blog-posts/` without asking.** It's a new top-level folder, and the workspace rules forbid it.
- **Forgetting the activity log row.** It's a standing requirement for every new file in the space.
