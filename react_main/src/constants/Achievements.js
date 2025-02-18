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
      reward: 10,
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
      reward: 10,
      roles: ["Fool"],
    },
    "New Sheriff in Town": {
      ID: "Mafia9",
      internal: ["SheriffShootEvil"],
      description: "As Sheriff, shoot and kill an Evil Player.",
      reward: 15,
      roles: ["Sheriff"],
    },
    "Analytical Genius": {
      ID: "Mafia10",
      internal: ["ProAnalyst"],
      description: "As Analyst, correctly guess the roles of five players.",
      reward: 10,
      roles: ["Analyst"],
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
