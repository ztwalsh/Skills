# brain/

What this project knows about itself: where it is going, how it decides, what it has learned,
and what has been decided and why. It lives in the repo so every session, every machine and
every collaborator reads the same thing.

| File | Holds | Changes |
|---|---|---|
| `product.md` | Strategy and direction: who it is for, what it is, what it is not | Rarely; edited in place |
| `principles.md` | The short list of rules that settle arguments | Rarely; edited in place |
| `insights.md` | What users and the builder have learned, dated | Often; add to the top, never rewrite |
| `decisions/` | What was decided and why, one file per area of the product | Often; add to the top, never rewrite |

How they feed each other: an insight that keeps proving true is promoted to a principle.
A decision names the principle it rests on.

`DESIGN.md` stays at the repo root and says what the look is **now**. `decisions/` says how it
got that way.

## Before product or design work

1. Read `product.md` and `principles.md`.
2. Read `decisions/product-wide.md`.
3. Read `decisions/<area>.md` for the area being worked on (the list is in `decisions/index.md`).

## Rules

- **A user's words are quoted exactly** and marked as theirs. An agent's reading is marked as
  the agent's. Never mix the two.
- **A missing reason is written as missing.** Never invent why something was decided.
- **Nothing is deleted.** A decision that no longer holds is marked superseded and points to
  what replaced it.
- **No personal details.** No names, emails or private content from users in a repo that is, or
  may become, public.
