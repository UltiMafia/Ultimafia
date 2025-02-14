//DO NOT CHANGE THE IDs
//DO NOT CHANGE THE IDs
//DO NOT CHANGE THE IDs
const AchievementData = {
  Mafia: {
    //Killing
    "Village Victory": {
      ID: "Mafia1",
      internal: ["VillageVictory"],
      description: "Win as a Village Role.",
      reward: 5,
    },
    "Mafia Victory": {
      ID: "Mafia2",
      internal: ["MafiaVictory"],
      description: "Win as a Mafia Role.",
      reward: 5,
    },
    "Cult Victory": {
      ID: "Mafia3",
      internal: ["CultVictory"],
      description: "Win as a Cult Role.",
      reward: 5,
    },
    "Independent  Victory": {
      ID: "Mafia4",
      internal: ["IndependentVictory"],
      description: "Win as a Independent Role.",
      reward: 5,
    },
    Scumhunter: {
      ID: "Mafia5",
      internal: ["Scumhunter"],
      description: "As Villager correctly vote on evil players for 3 days.",
      reward: 10,
      roles: ["Villager"],
    },
    /*
    "Nothing to see here": {
      ID: "Mafia6",
      internal: ["NothingToSeeHere"],
      description: "As Mafioso survive and win after being checked by a Cop or Detective.",
      reward: 20,
      roles: ["Mafioso"],
    },
    "Acceptable Losses": {
      ID: "Mafia7",
      internal: ["AcceptableLosses"],
      description: "As Cult Leader win with only Cult Aligned players in the Graveyard.",
      reward: 30,
      roles: ["Cult Leader"],
    },
    "April First": {
      ID: "Mafia8",
      internal: ["AprilFirst"],
      description: "As Fool win Day 1.",
      reward: 10,
      roles: ["Fool"],
    },
    "Do No Harm": {
      ID: "Mafia9",
      internal: ["DoctorSave"],
      description: "As a Doctor correctly save someone from being killed by the Mafia.",
      reward: 20,
      roles: ["Doctor"],
    },
    "Analytical Genius": {
      ID: "Mafia10",
      internal: ["ProAnalyst"],
      description: "As an Analyst correctly guess Five Players.",
      reward: 30,
      roles: ["Analyst"],
    },
    */
  },
  Resistance: {},
  Ghost: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Secret Hitler": {},
  "Wacky Words": {},
  "Liars Dice": {
  },
};

module.exports = AchievementsData;
