# Changelog agent template

Use this when a PR with **user-facing** changes is merged (or about to merge) and the site changelog should be updated.

## Source of truth

| File | Purpose |
|------|---------|
| `react_main/src/data/changelog.js` | Data rendered at **`/policy/changelog`** |
| `docs/changelog/AGENT_TEMPLATE.md` | This protocol (for humans + agents) |

Do **not** invent a second markdown changelog for the site UI. Edit `changelog.js` only (unless the user also asks for a GitHub `CHANGELOG.md` mirror).

---

## When to update

Update after (or as part of) shipping changes that players notice:

- New features, shop items, settings, roles, games
- Visible bug fixes
- Policy/UI/site navigation changes

Skip pure refactors, dependency bumps, and CI-only work unless the user asks to note them under **Other**.

---

## Categories (fixed set)

Use **only** these keys (same as the site chips):

| Key | Label | Use for |
|-----|--------|---------|
| `features` | Features | Major new capabilities (cross-cutting or flagship) |
| `game` | Game | In-game: roles, lobbies, ranked/comp, chat in-game, minigames |
| `site` | Site | Site-wide UI, nav, themes, accessibility, global settings |
| `profile` | Profile | User profile, avatars, banners, personal media, vanity |
| `family` | Family | Families, treasury, family perks, family page |
| `shop` | Shop | Shop sections, prices, purchasable items layout |
| `bugfixes` | Bug Fixes | Corrections to existing behavior |
| `community` | Community | Forums, mod tools, rules/policy pages, reports |
| `other` | Other | Chores, internal notes, misc |

**Rules:**

1. Prefer the most specific category (`profile` over `features` for avatar work).
2. Put flagship multi-area work in `features` **and** split details into area categories when helpful.
3. Omit empty categories from the entry entirely.
4. One bullet = one user-facing outcome (not a file list).

---

## Entry schema

Append a new object at the **top** of the `CHANGELOG` array (newest first):

```js
{
  id: "YYYY-MM-DD-short-slug",   // unique, kebab-case
  date: "YYYY-MM-DD",            // merge / ship date
  title: "Short human title",    // card heading
  prs: [1234, 1235],             // related PR numbers (optional but preferred)
  categories: {
    features: [
      "User-facing bullet…",
    ],
    game: [
      "…",
    ],
    bugfixes: [
      "…",
    ],
    // only include keys that have bullets
  },
},
```

### Bullet style

- Written for **players**, not developers
- Start with a capital letter; no trailing period required but stay consistent within a release
- Mention PR numbers in `prs[]`, not in every bullet (unless needed for clarity)
- Group related PR titles into coherent bullets; drop noise (`chore:`, commit hashes)
- Keep bullets scannable (one line each when possible)

### Title style

- `"Cosmetics update & ranked paste spam fixes"` — good
- `"Merge pull request #2928"` — bad

### Id style

- `"2026-08-10-cosmetics-spam"` — good
- Must be unique across the file

---

## Agent checklist

1. Read the PR title, body, and (if needed) file list / labels.
2. Decide **one** release entry (or add bullets to today’s existing entry if already started).
3. Map changes → categories above.
4. Insert the entry at the **top** of `CHANGELOG` in `react_main/src/data/changelog.js`.
5. Ensure the file still exports `CHANGELOG` and `CHANGELOG_CATEGORIES` (do not remove categories from the export list).
6. Load `/policy/changelog` locally and confirm the card appears under the right filters.
7. Do not rewrite historical entries unless fixing factual errors.

---

## Example (minimal)

```js
{
  id: "2026-09-01-example",
  date: "2026-09-01",
  title: "Example release",
  prs: [3000],
  categories: {
    game: [
      "Example: new lobby filter for practice games",
    ],
    bugfixes: [
      "Example: fixed crash when leaving a full lobby",
    ],
  },
},
```

---

## Site route

- **URL:** `/policy/changelog`
- **Nav:** Policy → Changelog  
- **Component:** `react_main/src/pages/Policy/Changelog.jsx`

---

## Past PR summarization notes

When backfilling history from GitHub:

1. `gh pr list --repo UltiMafia/Ultimafia --state merged --limit N`
2. Group by day or theme into releases (avoid one card per tiny PR when they ship together).
3. Prefer user impact over implementation detail.
4. Link all related PRs in `prs: []`.
