export const SnakeGameType = "Battlesnakes";
export const GameTypes = [
  "Mafia",
  "Resistance",
  "Ghost",
  "Jotto",
  "Acrotopia",
  "Secret Dictator",
  "Wacky Words",
  "Liars Dice",
  "Card Games",
  SnakeGameType,
];
export const Lobbies = [
  "Main",
  "Sandbox",
  "Competitive",
  "Games",
  "Survivor",
  "Roleplay",
];

export const Alignments = {
  Mafia: ["Village", "Mafia", "Cult", "Independent", "Event"],
  Resistance: ["Resistance", "Spies"],
  Ghost: ["Town", "Ghost", "Host"],
  Jotto: ["Town"],
  Acrotopia: ["Town"],
  "Secret Dictator": ["Liberals", "Fascists"],
  "Wacky Words": ["Town", "Host"],
  "Liars Dice": ["Liars", "Host"],
  "Card Games": ["Town", "Host"],
  [SnakeGameType]: ["Town"],
};

export const GameStates = {
  Mafia: ["Day", "Night"],
  Resistance: ["Team Selection", "Team Approval", "Mission"],
  Ghost: ["Night", "Give Clue", "Day", "Guess Word"],
  Jotto: ["Select Word", "Guess Word"],
  Acrotopia: ["Day", "Night"],
  "Secret Dictator": [
    "Nomination",
    "Election",
    "Legislative Session",
    "Executive Action",
    "Special Nomination",
  ],
  "Wacky Words": ["Day", "Night"],
  "Liars Dice": ["Guess Dice"],
  "Card Games": ["Place Bets", "Showdown"],
  [SnakeGameType]: ["Day"],
};

export const RatingThresholds = {
  wins: {},
  losses: {},
  abandons: {},
};

export const RequiredTotalForStats = 1;

export const MaxGameMessageLength = 240;
export const MaxTextInputLength = 100;
export const MaxWillLength = 100;

export const MaxGroupNameLength = 20;
export const MaxCategoryNameLength = 20;
export const MaxBoardNameLength = 20;
export const MaxBoardDescLength = 60;
export const MaxThreadTitleLength = 50;
export const MaxThreadContentLength = 5000;
export const MaxReplyLength = 1000;

export const MaxChatMessageLength = 240;

export const AlertFadeTimeout = 3000;
export const AlertFadeDuration = 500;

// animal deck by ultimafia-bot ultimafia.com/deck/jWqL8KjS_
export const PreferredDeckId = "jWqL8KjS_";

export const minimumLoadingTime = 200;
