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
      "Any disrespectful behavior on the basis of group identity. Includes bigotry of any kind (racism, homophobia, transphobia, misogyny, etc.), bypassing slur filters, and genocide denial. Please note that one is not permitted to use slurs or bigoted phrases despite belonging to affected groups (i.e. reclamation).",
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
      "Graphic or textual descriptions of adult behavior, including explicit sex acts, drug use, lewd word, mentions or descriptions of content intended to shock or disturb, pornographic websites, or descriptions of real violence or assault.",
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
    id: "antagonization",
    name: "Antagonization",
    description: [
      {
        type: "paragraph",
        content:
          "Antagonizing other users, intentionally disrupting gameplay, or engaging in conduct designed to provoke negative reactions. Gameplay must be conducted in good faith and with respect for other participants to not undermine proper sportsmanship.",
      },
      {
        type: "list",
        items: [
          "Taking game actions primarily to incite frustration or disrupt said game (e.g., 'hip-firing' or shots based on no or minimal information available)",
          "Communication with the primary intent of provoking or upsetting other users",
          "Repeatedly posting the same message, flooding chat, or engaging in vote spam",
          "Repeatedly leaving and rejoining games, particularly when a match is about to begin",
          "Targeting a user based on personal grudges, prior disputes, or out-of-game conflicts rather than in-game strategy",
        ],
      },
    ],
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "game-throwing",
    name: "Game Throwing",
    description:
      "Intentionally playing against your win condition or not playing to win. Game Throwing requires intent. Includes fake claims made for any other purpose than strategy as well as voting someone based on a grudge. Forcing a draw (endgame event) when you are not faced with an autolose situation falls under this category as well, since condemning/killing would give you a chance to win.",
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "game-related-abandonment",
    name: "Game-Related Abandonment (GRA)",
    description:
      "Leaving a ranked or competitive game after it has started. Going AFK to unrank a game also applies.",
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "cheating",
    name: "Cheating",
    description: [
      {
        type: "paragraph",
        content:
          "Manipulation or conduct that provides an unfair competitive advantage or undermines the integrity of the game. Also can be categorized as circumventing game mechanics, concealed coordinated activity, or manipulate outcomes of games.",
      },
      {
        type: "list",
        items: [
          "Using multiple accounts within the same game ('multiaccounting' or 'alt'ing')",
          "Sharing a singular account across ranked or competitive games among two or more users ('account sharing')",
          "Communicating with other participants through external means not within an in-progress game",
          "Taking screenshots or other methods of sharing in game information to prove alignment or gain strategic advantage",
          "Coordinating externally for specific outcomes, or playing with the intent of ensuring another user's victory via external coordination",
          "Pretending to cheat as a 'reaction test' or otherwise claimed strategic tactic",
        ],
      },
    ],
    offenses: ["24 hours", "Loss of privilege", "-", "-", "-", "-"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "insufficient-participation",
    name: "Insufficient Participation (ISP)",
    description: [
      {
        type: "paragraph",
        content:
          "Playing without meaningful participation, focus, or lack of responsiveness. May also be applied if a user causes a loss due to a lack of game related effort.",
      },
      {
        type: "list",
        items: [
          "Failing to contribute over the course of a game or during periods when directly addressed, voted, or pinged",
          "Diverting attention to unrelated activities",
          "Using gimmicks in place of participation",
          "Speaking primarily about topics unrelated to the game",
          "Pretending to be or faking away from keyboard",
          "Vote flashing or using votes as a substitute for substantive communication (excluding role-specific mechanics that require such)",
        ],
      },
      {
        type: "paragraph",
        content:
          "If a user must step away, they are expected to notify other users and review the progress of the game upon returning to ensure vital information is not missed. Please note, Insufficient Participation (ISP) is applied more leniently in designated red heart games compared to yellow heart games, but expectations of good faith effort and engagement remain.",
      },
    ],
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "outside-game-information",
    name: "Outside of Game Information (OGI)",
    description:
      "Using tools or processes outside of a game in a game including, but not limited to: posting on profiles, lobbies, or the forums revealing game-related information, clearly stated meta posted on profile, whether followed or not, reporting a player in a game while that game is in progress, using third party functions or sites to make in-game decisions, bribes or threats (such as karma, kudos, and reporting), and pregame pacts.",
    offenses: ["1 hour", "12 hours", "24 hours", "3 months"],
    category: "Game",
    appliesTo: ["game", "playRanked", "playCompetitive"],
  },
  {
    id: "exploits",
    name: "Exploits",
    description:
      "Intentionally abusing bugs/glitches to gain advantage. Not reporting a bug for the same purpose also applies.",
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
