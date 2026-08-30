# drafts/YYYY-Www.md format

One file per ISO week. Newest drafts skill run updates it in place.

```markdown
# 2026-W35 · Aug 25–31

## Week in review
_(for me, not for posting)_

**assistantOS**
- Drive-push dropdown got the real Google Drive logo; all menus → 14px + more padding
- Starred docs now trigger a Zapier "push to Drive" action

**wallpaper**
- Rewrote shuffle so it stops repeating the last 5

**ztwalsh.com**
- (nothing shippable — just dependency bumps)

---

## Post candidates

### 1 · Threads · assistantOS menu polish
**Text:**
> spent an embarrassing amount of today on dropdown menus in my assistant app.
> real app icons instead of generic glyphs, 14px type, more breathing room.
> nobody will notice individually. together it's the difference between "side
> project" and "product".

**Visual:** `assets/2026-08-29-assistantOS-drive-dropdown/after.png` (have it)
+ NEEDS CAPTURE: old menu screenshot for the before
**Angle:** the "small polish compounds" take — reliably resonates, low stakes.

---

### 2 · X · wallpaper shuffle
**Text:**
> my wallpaper app kept showing me the same 3 images. turns out "random" needs
> a memory. added a rolling exclusion of the last 5 — 20 lines, should've done
> it a year ago.

**Visual:** NEEDS CAPTURE — short screen recording of the shuffle cycling
(`assets/2026-08-28-wallpaper-shuffle/SHOT-LIST.md`)
**Angle:** relatable bug, tiny fix, mild self-deprecation. Fits the voice.

---

## Thread outlines

### assistantOS: a week of details (Threads, 4 posts)
1. hook — "shipped no features this week. just details. here's what changed."
2. the Drive dropdown: generic glyph → real logo, before/after image
3. menu type scale: matched the Figma spec app-wide, 16px → 14px, screenshot
4. why it's worth a whole week — the "feels legit" threshold

---

## Carry-forward
- assistantOS starred-docs → Zapier trigger (no visual yet; needs a flow diagram
  or screen recording before it's postable)
```

## Rules

- **Week in review** is plain notes for Zachary. Everything under **Post
  candidates** / **Thread outlines** is paste-ready and must obey `voice.md`.
- Every candidate names a visual: a real file path, or `NEEDS CAPTURE: <what>`
  with the `assets/.../SHOT-LIST.md` path.
- 4–8 candidates. Mix platforms and lengths. Don't force a post out of thin work
  — a light week is a short file.
- Carry-forward is anything shareable from the window that didn't make the cut,
  so it gets another look next week.
