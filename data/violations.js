const violationDefinitions = [
  {
    id: "personal-attacks-harassment",
    name: "Personal Attacks & Harassment (PA)",
    description: [
      {
        type: "paragraph",
        content:
          "Repeatedly antagonizing, targeting, or harassing an individual user or multiple users in a deliberate and sustained manner. Targeted conduct intended to intimidate, demean, or isolate others is not welcomed at UltiMafia, regardless of whether the individual engaging in the behavior believes it is 'justified'.",
      },
      {
        type: "paragraph",
        content:
          "A behavior may be considered harassment regardless of whether the affected individual has explicitly asked to stop or not. Deliberately joining multiple games with people who are trying to avoid you in order to antagonize them is also considered to fall under this category.",
      },
    ],
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
    description: [
      {
        type: "paragraph",
        content:
          'Discrimination or disrespectful conduct based on group identity. Prohibited behavior includes, but is not limited to, racism, homophobia, transphobia, misogyny, religious discrimination, xenophobia, ableism, or any other form of bigotry otherwise not listed. Per section 2 of the staff handbook, our mission statement intends to, "maintain[ing] a community free from prejudice or bias based on sex, age, gender identity, sexual orientation, skin color, ability, religion, nationality, or any other characteristic."',
      },
      {
        type: "paragraph",
        content:
          'Intolerance also includes bypassing slur filters, as well as the denial or minimization of acts of genocide or systemic oppression of minority groups. The use of slurs, derogatory language, or bigoted expressions also falls into this rule, including instances where an individual belongs to the affected group or claims the language is being "reclaimed."',
      },
      {
        type: "paragraph",
        content:
          "Breaking of this rule may result in punishment dependent on severity [Idk how we will change scale of punishment here]",
      },
    ],
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
    description: [
      {
        type: "paragraph",
        content:
          "Content or material not appropriate for users under the age of 18. You may not create, share, display, or distribute content otherwise considered 'Not Safe for Work'. This includes, but is not limited to:",
      },
      {
        type: "list",
        items: [
          "Graphic, written, or visual depictions of sexual activity or explicit acts",
          "Descriptions or portrayals of illegal drug use and/or behavior that promotes substance abuse",
          "Lewd, obscene, or sexually explicit language",
          "Content intended to shock, disturb, or offend others (i.e. shock sites, gore, etc.)",
          "Access to or promotion of pornographic websites",
          "Descriptions or depictions of real violence or assault",
        ],
      },
      {
        type: "paragraph",
        content:
          "Breaking of this rule may result in punishment dependent on severity [Idk how we will change scale of punishment here]",
      },
    ],
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
    description: [
      {
        type: "paragraph",
        content:
          "Intentionally provoking or escalating conflict between users, whether between yourself and another, or two separate parties. This includes among others from the moderation's discretion: engaging in trolling behavior (including concern trolling, political trolling, spamming, etc.), initiating or encouraging large-scale public arguments, or disingenuously promoting drama and/or division within community spaces.",
      },
      {
        type: "paragraph",
        content:
          "Concerns regarding user behavior should be addressed through the appropriate reporting channels. The designated reporting tools exist to ensure issues are reviewed and handled in a fair and consistent manner. Breaking of this rule may result in punishment dependent on severity [Idk how we will change scale of punishment here]",
      },
    ],
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
    description: [
      {
        type: "paragraph",
        content:
          "Hazing includes any behavior that discriminates against or mistreats users based solely on the fact that they are a new user, case and point. Prohibited conduct includes, but is not limited to: engaging in policy-based voting against new users without merit, falsely accusing new users of rule violations, or promoting attitudes or practices that discourage community growth. Potential harassment may incur multiple violations along side Hazing.",
      },
      {
        type: "paragraph",
        content:
          "Breaking of this rule may result in punishment dependent on severity [Idk how we will change scale of punishment here]",
      },
    ],
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
      "Threatening, pressuring, or blackmailing users in order to influence their actions, decisions, or participation within the community. Conduct considered as coercion specifically includes leveraging or threatening social, reputational, or other consequences, particularly those extending off-site (online or offline), in order to gain compliance or exert control from other users.",
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
    description: [
      {
        type: "paragraph",
        content:
          "The sharing, linking to, or participation in illegal or potentially illegal activity is strictly prohibited and will not be tolerated if a user is suspected to have partaken in illegal content and/or activity. Unlawful conduct, include but are not limited to:",
      },
      {
        type: "list",
        items: [
          "Inappropriate or unlawful interactions involving a minor",
          "The distribution, solicitation, or possession of CSAM",
          "Promotion or facilitation of terrorism or organized criminal activity",
          "Credible threats of violence or otherwise real world harm",
        ],
      },
      {
        type: "paragraph",
        content:
          "Moderation reserves the right to report suspected illegal activity to appropriate law enforcement authorities whenever possible and as required by law.",
      },
    ],
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
    offenses: ["24 hours", "24 hours", "3 months"],
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
    offenses: ["12 hours", "24 hours", "3 months"],
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
