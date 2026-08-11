/**
 * Site changelog: single source of truth for /policy/changelog
 *
 * Agents: read docs/changelog/AGENT_TEMPLATE.md before editing this file.
 * Keep newest releases first. Use only CATEGORY keys defined below.
 */

/** @typedef {'features'|'game'|'site'|'profile'|'family'|'shop'|'bugfixes'|'community'|'other'} ChangelogCategory */

/**
 * Display order and labels for categories on the page and in agent output.
 * Omit empty categories when writing an entry.
 */
export const CHANGELOG_CATEGORIES = [
  { key: "features", label: "Features" },
  { key: "game", label: "Game" },
  { key: "site", label: "Site" },
  { key: "profile", label: "Profile" },
  { key: "family", label: "Family" },
  { key: "shop", label: "Shop" },
  { key: "bugfixes", label: "Bug Fixes" },
  { key: "community", label: "Community" },
  { key: "other", label: "Other" },
];

/**
 * @typedef {Object} ChangelogRelease
 * @property {string} id - Stable id, e.g. "2026-08-10-cosmetics"
 * @property {string} date - ISO date YYYY-MM-DD (release / merge day)
 * @property {string} title - Short human title for the release card
 * @property {number[]} [prs] - Related PR numbers
 * @property {Partial<Record<ChangelogCategory, string[]>>} categories
 *   Bullet strings; user-facing, present tense or past OK; no raw commit noise
 */

/** @type {ChangelogRelease[]} */
export const CHANGELOG = [
  {
    id: "2026-08-10-cosmetics-spam",
    date: "2026-08-10",
    title: "Cosmetics update & ranked paste spam fixes",
    prs: [2928, 2930],
    categories: {
      features: [
        "Name cosmetics: custom fonts and animated name colors (including tricolor gradient) on the in-game player list and chat nameplates",
        "Animated profile banners and profile pictures (GIF/WebP) with pan/zoom crop and optional “keep animation”",
        "Family Music Player perk and collapsible profile/family media players",
        "Site setting: Disable All Media Autoplay (viewer preference)",
      ],
      game: [
        "Name fonts and animated colors apply in-game (player list + chat nameplates, not message body text)",
        "Ranked/competitive typing: fewer false positives for paste; block rapid near-duplicate paste spam",
      ],
      profile: [
        "Remove avatar / remove banner controls on profile",
        "Collapse Media Player: starts collapsed when enabled; music icon + expand control",
        "Higher upload limits for animated avatars (25 MB) and banners (20 MB) when owned",
      ],
      family: [
        "Family animated avatar and family banner as treasury perks (not main Shop)",
        "Family Music Player perk; media settings for leaders; player on the right above Members",
        "Shorter perk blurbs with info tooltips",
      ],
      shop: [
        "Section order: Game → Profile → Site → Decks",
        "Name cosmetics and custom emotes listed under Game; archive items under Profile (last pair)",
      ],
      bugfixes: [
        "Color pickers no longer auto-save on Settings load (false shop errors)",
        "Safer banner upload path handling",
        "Bootstrap load spinner no longer hangs forever if a site/user info API fails",
        "Boolean settings persistence (checkboxes stay in sync after reload)",
      ],
    },
  },
  {
    id: "2026-08-08-comp-ranked-gate",
    date: "2026-08-08",
    title: "Legacy competitive/ranked gating removed",
    prs: [2926],
    categories: {
      game: [
        "Removed legacy code that gated competitive/ranked access",
      ],
      other: [
        "Cleanup only; no new cosmetics or shop items",
      ],
    },
  },
  {
    id: "2026-08-04-rules-modals",
    date: "2026-08-04",
    title: "Sportsmanship rules & join modals",
    prs: [2924, 2925, 2922],
    categories: {
      site: [
        "Join experience: join modals improvements",
      ],
      community: [
        "Rules page rewritten to match the sportsmanship policy",
      ],
      game: [
        "Laundress system message cleanup",
      ],
    },
  },
  {
    id: "2026-08-01-newspapers",
    date: "2026-08-01",
    title: "Newspaper timestamps",
    prs: [2921],
    categories: {
      game: [
        "Newspapers show timestamps",
      ],
    },
  },
  {
    id: "2026-07-14-ranked-refunds",
    date: "2026-07-14",
    title: "Ranked persistence & refunds",
    prs: [2915, 2916],
    categories: {
      bugfixes: [
        "Prevent duplicate ranked game persistence in endPostgame",
        "Better refund handling",
      ],
    },
  },
  {
    id: "2026-07-11-skill-hof-mobile",
    date: "2026-07-11",
    title: "Skill rating, Hall of Fame, mobile polish",
    prs: [2895, 2910, 2911, 2912, 2913, 2906],
    categories: {
      features: [
        "OpenSkill-based skill rating system",
      ],
      site: [
        "Hall of Fame page refresh",
        "New competitive tier icons",
        "Mobile UI touchups",
      ],
      profile: [
        "“Hide Statistics” also hides Skill Rating",
        "Profile ratings UI improvements",
      ],
      bugfixes: [
        "Skill rating performance optimizations",
      ],
    },
  },
  {
    id: "2026-07-11-chess",
    date: "2026-07-10",
    title: "Chess minigame",
    prs: [2902],
    categories: {
      features: [
        "Chess minigame added",
      ],
      game: [
        "Play Chess as a supported minigame type",
      ],
    },
  },
  {
    id: "2026-07-10-family-stocks",
    date: "2026-07-10",
    title: "Families, treasury & stock market",
    prs: [2908, 2894, 2892, 2882, 2881, 2879, 2877, 2875, 2874, 2865],
    categories: {
      features: [
        "Family treasury, stock trading, and applications system",
        "Paginated/filterable transaction history",
        "Net worth and stock value on the stock market page",
      ],
      family: [
        "Family applications and treasury tooling",
        "Family-related stock market links and dividends display",
      ],
      site: [
        "Stock market fee adjustments and portfolio UI improvements",
        "Mobile stock market layout fixes",
      ],
      bugfixes: [
        "Stock concurrency, data integrity, and dividend distribution fixes",
        "Username colors respect accessibility contrast on stock pages",
        "Inventory during day no longer bugs out; postgame timer ends games",
        "Player list order maintained after pregame leaves",
      ],
    },
  },
  {
    id: "2026-07-03-mafia-fixes",
    date: "2026-07-03",
    title: "Mafia message & event fixes",
    prs: [2873, 2901],
    categories: {
      bugfixes: [
        "Meteor + anonymous message clearing fixes",
        "Oracle death reveal preserves colon delimiter for modifier rendering",
      ],
    },
  },
  {
    id: "2026-06-23-mod-hearts-stats",
    date: "2026-06-23",
    title: "Mod hearts & stats fortification",
    prs: [2859, 2858],
    categories: {
      community: [
        "Mod actions to award/revoke hearts",
      ],
      bugfixes: [
        "Fortified stats handling",
      ],
    },
  },
];

export default CHANGELOG;

/** localStorage key: last changelog release id the user dismissed */
export const CHANGELOG_SEEN_STORAGE_KEY = "ultimafia:changelog:lastSeenId";

export function getLatestChangelogId() {
  return CHANGELOG[0]?.id || null;
}

/**
 * Releases the user has not dismissed yet.
 * - Never visited: only the latest entry (no history dump)
 * - Last seen is current latest: empty
 * - Last seen is older id: all entries above that id
 * - Unknown last-seen id (reset data): latest only
 */
export function getUnseenChangelogReleases(lastSeenId) {
  if (!CHANGELOG.length) return [];
  if (!lastSeenId) return [CHANGELOG[0]];
  const idx = CHANGELOG.findIndex((r) => r.id === lastSeenId);
  if (idx === 0) return [];
  if (idx === -1) return [CHANGELOG[0]];
  return CHANGELOG.slice(0, idx);
}

export function markChangelogSeen(releaseId) {
  if (!releaseId) return;
  try {
    window.localStorage.setItem(CHANGELOG_SEEN_STORAGE_KEY, releaseId);
  } catch {
    // private mode / blocked storage
  }
}

export function readChangelogSeenId() {
  try {
    return window.localStorage.getItem(CHANGELOG_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}
