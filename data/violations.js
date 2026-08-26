const violationDefinitions = [
  {
    id: "personal-attacks-harassment",
    name: "Personal Attacks & Harassment (PA)",
    offenses: [
      "12 hours",
      "24 hours",
      "48 hours",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "intolerance",
    name: "Intolerance",
    offenses: [
      "12 hours",
      "24 hours",
      "48 hours",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "adult-content",
    name: "Adult Content",
    offenses: [
      "24 hours",
      "24 hours",
      "48 hours",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "instigation",
    name: "Instigation",
    offenses: [
      "12 hours",
      "24 hours",
      "48 hours",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "hazing",
    name: "Hazing",
    offenses: [
      "24 hours",
      "24 hours",
      "48 hours",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "outing-personal-information",
    name: "Outing of Personal Information (OPI)",
    offenses: [
      "6 months",
      "Permaban",
      "Permaban",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "coercion",
    name: "Coercion",
    offenses: [
      "24 hours",
      "24 hours",
      "48 hours",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "impersonation",
    name: "Impersonation",
    offenses: [
      "24 hours",
      "24 hours",
      "48 hours",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "illegal-content-activity",
    name: "Illegal Content & Activity (IC)",
    offenses: [
      "Permaban",
      "Permaban",
      "Permaban",
      "Permaban",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "antagonization",
    name: "Antagonization",
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "game-throwing",
    name: "Game Throwing",
    offenses: ["24 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "game-related-abandonment",
    name: "Game-Related Abandonment (GRA)",
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "cheating",
    name: "Cheating",
    offenses: ["24 hours", "Loss of privilege", "-", "-", "-", "-"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "insufficient-participation",
    name: "Insufficient Participation (ISP)",
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "outside-game-information",
    name: "Outside of Game Information (OGI)",
    offenses: ["12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "exploits",
    name: "Exploits",
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
];

const violationMapById = violationDefinitions.reduce((acc, violation) => {
  acc[violation.id] = violation;
  return acc;
}, {});

function getViolationsForBanType(banType) {
  return violationDefinitions.filter((violation) =>
    violation.appliesTo.includes(banType)
  );
}

const communityViolations = violationDefinitions.filter(
  (violation) => violation.category === "Community"
);
const gameViolations = violationDefinitions.filter(
  (violation) => violation.category === "Game"
);

module.exports = {
  violationDefinitions,
  violationMapById,
  getViolationsForBanType,
  communityViolations,
  gameViolations,
};
