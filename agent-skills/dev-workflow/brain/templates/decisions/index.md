# Decisions

One file per area of the product, so an agent working on an area reads one file and has every
past call and its reason. Inside each file, newest first.

## Areas

Use only the areas in this table. To add one, add a row here first, then create the file from
`_area.md`. Name areas the way the product's own navigation does.

| Area | File | Covers |
|---|---|---|
| Product-wide | `product-wide.md` | Calls that apply everywhere: brand, colour, tone, content rules, how we ship. Always read. |

## Brainstorms

`brainstorms/` holds the full pass-by-pass history of each brainstorm, written by the brainstorm
skill. An area file's entry links to the history it came from.

## Entry format

```
## YYYY-MM-DD · The decision in one line
**Status:** stands | superseded by YYYY-MM-DD · title
**Decision:** what was decided, in one or two sentences.
**Why:**
> the user's words, word for word, when there are any
Agent's reading: anything added by the agent, marked as such. "No reason given." when none was.
**Ruled out:** what was considered and not chosen, and why if known.
**Rests on:** the principle it follows, if any.
**More:** link to brainstorms/<file>.md, a commit, or a ticket.
```
