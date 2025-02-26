//DO NOT CHANGE THE IDs
//DO NOT CHANGE THE IDs
//DO NOT CHANGE THE IDs
export const AchievementData = {
  Mafia: {
    //Killing
    "Village Victory": {
      ID: "Mafia1",
      internal: ["VillageVictory"],
      description: "Win as any Village Role.",
      reward: 5,
    },
    "Mafia Victory": {
      ID: "Mafia2",
      internal: ["MafiaVictory"],
      description: "Win as any Mafia Role.",
      reward: 5,
    },
    "Cult Victory": {
      ID: "Mafia3",
      internal: ["CultVictory"],
      description: "Win as any Cult Role.",
      reward: 5,
    },
    "Independent  Victory": {
      ID: "Mafia4",
      internal: ["IndependentVictory"],
      description: "Win as any Independent Role.",
      reward: 5,
    },
    Scumhunter: {
      ID: "Mafia5",
      internal: ["Scumhunter"],
      description: "As Villager, correctly vote on evil players for 3 days.",
      reward: 15,
      roles: ["Villager"],
    },
    "Nothing to see here": {
      ID: "Mafia6",
      internal: ["NothingToSeeHere"],
      description:
        "As Mafioso, survive and win after being checked by a Cop or Detective.",
      reward: 20,
      roles: ["Mafioso"],
    },
    "Acceptable Losses": {
      ID: "Mafia7",
      internal: ["AllDeadAreCult"],
      description:
        "As Cult Leader, win with only Cult-aligned players in the Graveyard.",
      reward: 30,
      roles: ["Cult Leader"],
    },
    "April First": {
      ID: "Mafia8",
      internal: ["FoolWinDayOne"],
      description: "As Fool, win on Day 1.",
      reward: 15,
      roles: ["Fool"],
    },
    "New Sheriff in Town": {
      ID: "Mafia9",
      internal: ["SheriffShootEvil"],
      description: "As Sheriff, shoot and kill an Evil Player.",
      reward: 10,
      roles: ["Sheriff"],
    },
    "Analytical Genius": {
      ID: "Mafia10",
      internal: ["ProAnalyst"],
      description: "As Analyst, correctly guess the roles of five players.",
      reward: 30,
      roles: ["Analyst"],
    },
    Quickdraw: {
      ID: "Mafia11",
      internal: ["DeputyShootGunnedEvil"],
      description:
        "As Deputy, shoot and kill an Evil Player who is carrying a Gun or Rifle.",
      reward: 20,
      roles: ["Deputy"],
    },
    "Super Sleuth!": {
      ID: "Mafia12",
      internal: ["CopFindEvil"],
      description: "As Cop, find an Evil player.",
      reward: 10,
      roles: ["Cop"],
    },
    Philharmonic: {
      ID: "Mafia13",
      internal: ["Fiddle2PRRoles"],
      description:
        "As Fiddler, Fiddle 2 diffrent village power roles during a game.",
      reward: 20,
      roles: ["Fiddler"],
    },
    "Clean it Up, Janny": {
      ID: "Mafia14",
      internal: ["JanCleanPR"],
      description: "As Janitor, clean a Village power role.",
      reward: 10,
      roles: ["Janitor"],
    },
    Unexpected: {
      ID: "Mafia15",
      internal: ["InquisitorDouble"],
      description: "As Inquisitor, convert 2 players to Cultist.",
      reward: 15,
      roles: ["Inquisitor"],
    },
    VTS: {
      ID: "Mafia16",
      internal: ["ChangelingWin"],
      description:
        "As Changeling, win by using the Changeling's alternate win condition.",
      reward: 15,
      roles: ["Changeling"],
    },
    "Early Execution": {
      ID: "Mafia17",
      internal: ["ExecutionerWinDay1"],
      description: "As Executioner, win on Day 1.",
      reward: 20,
      roles: ["Executioner"],
    },
    "Early Bird": {
      ID: "Mafia18",
      internal: ["DodoWinDay1"],
      description: "As Dodo, win on Day 1.",
      reward: 15,
      roles: ["Dodo"],
    },
    "It was Him!": {
      ID: "Mafia19",
      internal: ["LawyerFrame"],
      description:
        "As Lawyer, make a player shows as Mafia to a Cop or Detective report.",
      reward: 20,
      roles: ["Lawyer"],
    },
    "Elementary, Watson": {
      ID: "Mafia20",
      internal: ["DetectiveCheck2"],
      description: "As Detective, find 2 Evil players and Survive.",
      reward: 30,
      roles: ["Detective"],
    },
  },
  Resistance: {},
  Ghost: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Wacky Words": {},
  "Liars Dice": {},
};
