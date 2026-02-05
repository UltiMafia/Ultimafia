const violationDefinitions = [
  {
    id: "personal-attacks-harassment",
    name: "Personal Attacks & Harassment (PA)",
    description:
      "Repeatedly antagonizing or harassing a user or multiple users in a specific, targeted manner. Victims of harassment are not required to ask for the behavior to stop for it to be considered harassment.",
    offenses: [
      "1 day",
      "3 days",
      "3 weeks",
      "6 months",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "intolerance",
    name: "Intolerance",
    description:
      "Any disrespectful behavior on the basis of group identity. Includes bigotry of any kind (racism, homophobia, transphobia, misogyny, etc.), bypassing slur filters, and genocide denial.",
    offenses: [
      "1 day",
      "3 days",
      "3 weeks",
      "6 months",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "adult-content",
    name: "Adult Content",
    description:
      'Graphic descriptions of adult behavior, including explicit sex acts, drug use, or descriptions of real violence. Restrict to a "13 and up" mindset.',
    offenses: [
      "1 day",
      "3 days",
      "3 weeks",
      "6 months",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "instigation",
    name: "Instigation",
    description:
      "Intentionally baiting conflict between users, including concern trolling, mass arguments in public spaces, or disingenuously encouraging drama. The report function exists for a reason.",
    offenses: [
      "1 day",
      "3 days",
      "3 weeks",
      "6 months",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "hazing",
    name: "Hazing",
    description:
      "Discriminating against or mistreating users on new accounts. Includes policy-voting, falsely accusing a new account of rule-breaking, and promoting an anti-growth mindset.",
    offenses: [
      "1 day",
      "3 days",
      "3 weeks",
      "6 months",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "outing-personal-information",
    name: "Outing of Personal Information (OPI)",
    description:
      "Revealing the personal or identifying information of other users without consent (including names, locations, age, etc.).",
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
    description:
      "Threatening or blackmailing users with social consequences, especially those with off-site ramifications.",
    offenses: [
      "1 day",
      "3 days",
      "3 weeks",
      "6 months",
      "Permaban",
      "Permaban",
    ],
    category: "Community",
    appliesTo: ["site", "chat", "forum", "ipFlag"],
  },
  {
    id: "impersonation",
    name: "Impersonation",
    description:
      "Pretending to be another user with intent to defame or frame them. Includes creating a similar username or outright claiming to be them maliciously.",
    offenses: [
      "3 months",
      "6 months",
      "Permaban",
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
    description:
      "Posting, linking to, or participating in illegal or potentially illegal activity (e.g. inappropriate conduct with a minor). Law enforcement will be notified when possible.",
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
    id: "game-throwing",
    name: "Game Throwing",
    description:
      "Failing to play toward your win condition (e.g. outing mafia partners), or playing toward the win condition of an alignment is not your own (i.e. assisting a Cult win when you are Village), including situations where one's alignment can hypothetically be changed. Players must always play to their present win-condition rather than hypothetical or future win conditions they may later acquire. Using tactics with no reasonable chance of success also qualifies. Please note that Game Throwing requires intent.",
    offenses: ["1 day", "1 week", "3 weeks", "Loss of privilege", "-", "-"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "game-related-abandonment",
    name: "Game-Related Abandonment (GRA)",
    description:
      "Leaving a ranked or competitive game after it has started. Going AFK to unrank a game also applies.",
    offenses: ["1 day", "1 week", "3 weeks", "Loss of privilege", "-", "-"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "insufficient-participation",
    name: "Insufficient Participation (ISP)",
    description: "Not participating actively or consistently in a game.",
    offenses: ["1 day", "1 week", "3 weeks", "Loss of privilege", "-", "-"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "outside-game-information",
    name: "Outside of Game Information (OGI)",
    description:
      "Using external info to influence the game. Includes outside comms, threats of retaliation, or copy/pasting system messages.",
    offenses: ["1 day", "1 week", "3 weeks", "Loss of privilege", "-", "-"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "exploits",
    name: "Exploits",
    description:
      "Intentionally abusing bugs/glitches to gain advantage. Not reporting a bug for the same purpose also applies.",
    offenses: ["1 day", "1 week", "3 weeks", "Loss of privilege", "-", "-"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "cheating",
    name: "Cheating",
    description:
      "Any manipulation that provides an unfair advantage (multi-accounting, external discussion of game info, using exploits).",
    offenses: ["1 day", "1 week", "3 weeks", "Loss of privilege", "-", "-"],
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
