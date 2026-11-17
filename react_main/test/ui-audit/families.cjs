// Page families used by the dialog and overlay audit.
// Members refer to route-case names in test/routeReviewData.jsx, except the
// generated game-editor cases below. A family is an appearance contract: it does
// not require the members to share code.
const gameTypes = [
  "Mafia", "Jotto", "Acrotopia", "Secret Dictator", "Wacky Words", "Draw It",
  "Liars Dice", "Texas Hold Em", "Cheat", "Ratscrew", "Battlesnakes",
  "Dice Wars", "Connect Four", "Spot It", "Battleship", "Chess",
];

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ?game= selects the production per-game editor; no copy/setup data is needed.
const generatedCases = gameTypes.map((game) => ({
  name: `editor-${slug(game)}`,
  route: `/play/create?game=${encodeURIComponent(game)}`,
  selector: ".ui-page",
  generated: true,
}));

const families = [
  {
    id: "profiles",
    label: "Identity profiles",
    members: [
      "profile-minimal", "profile-default", "profile-self", "profile-rich", "profile-custom",
      "family-profile", "family-leader",
    ],
  },
  {
    id: "reference",
    label: "Reference detail pages",
    members: ["role-detail", "setup-detail"],
  },
  {
    id: "directories",
    label: "Directories and standings",
    members: [
      "players", "families", "host", "character-decks", "word-decks", "tutorial",
      "rankings", "competitive", "contributors", "donors", "notifications",
    ],
  },
  {
    id: "forums",
    label: "Forums",
    members: ["forum-categories", "forum-board", "forum-thread"],
  },
  {
    id: "editors-setup",
    label: "Setup editors (one skeleton)",
    // Mafia is the only editor that currently reads as finished; use it as the
    // reference member so differences are reported against a known-good page.
    reference: "create-setup",
    members: ["create-setup", ...generatedCases.map((entry) => entry.name)],
  },
  {
    id: "editors-deck",
    label: "Deck and word-deck editors",
    members: ["character-deck-editor", "word-deck-editor"],
  },
  {
    id: "settings",
    label: "Settings",
    members: [
      "settings-site", "settings-profile", "settings-game", "settings-account",
      "settings-github", "settings-cookies", "settings-family",
    ],
  },
  {
    id: "moderation",
    label: "Moderation workspace",
    members: [
      "moderation-log", "moderation-tools", "moderation-groups", "moderation-reports",
      "moderation-volunteer", "moderation-competitive", "moderation-ban-appeals",
      "moderation-ban-case", "admin-intake", "admin-github", "invoices",
    ],
  },
  {
    id: "longform",
    label: "Long-form documents",
    members: ["rules", "terms", "privacy", "staff-handbook", "glossary", "competitive-faq"],
  },
  {
    id: "activity",
    label: "Activity",
    members: ["activity-metrics", "activity-feed"],
  },
];

const memberOf = new Map();
for (const family of families) for (const name of family.members) memberOf.set(name, family.id);

// The live feed's fixture preview text is not rendered by the current filter
// defaults, so wait for the page shell for this route instead of its content.
const caseOverrides = {
  "activity-feed": { anyContent: true, text: undefined },
};

module.exports = { families, generatedCases, gameTypes, memberOf, caseOverrides };
