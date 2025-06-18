//DO NOT CHANGE THE IDs
//const AchievementData = require("../react_main/src/constants/Achievements");
//DO NOT CHANGE THE IDs
//DO NOT CHANGE THE IDs

//The idea is users will be given 1 challenge from each tier. 
//The joke ones could have a 1/100 chance to replace a real challenge
//Currently thinking 2/5/7 for coin rewards

const DailyChallengeData = {
  Tier1: {
    "Play a game of (GameType)": {
      ID: "Basic1",
      internal: ["PlayTypeOfGame"],
      description: "Complete a game of (GameType) with no vegs or leavers.",
      reward: 2,
    },
    "Play 3 Games": {
      ID: "Basic2",
      internal: ["Play3Games"],
      description: "Complete 3 games with no vegs or leavers.",
      reward: 2,
    },
    "Play 3 Diffrent Setups": {
      ID: "Basic3",
      internal: ["Play3Setups"],
      description: "Complete 3 games with no vegs or leavers each in a diffrent mafia setup.",
      reward: 2,
      incompatible: ["Hard5"],
    },
    "Play a Featured Setup": {
      ID: "Basic4",
      internal: ["Play3Games"],
      description: "Complete a game with no vegs or leavers in a featured mafia setup.",
      reward: 2,
      incompatible: ["Advanced3"],
    },
  },
  Tier2: {
    "Win a ranked game": {
      ID: "Advanced1",
      internal: ["WinRanked"],
      description: "Win a ranked game.",
      reward: 5,
    },
    "Win as (Role)": {
      ID: "Advanced2",
      internal: ["WinAsRole"],
      description: "Win as (RoleName) in a game with no vegs or leavers.",
      reward: 5,
    },
    "Win in a Featured Setup": {
      ID: "Advanced3",
      internal: ["WinAsRole"],
      description: "Win in a featured mafia setup in a game with no vegs or leavers.",
      reward: 5,
      incompatible: ["Basic4"],
    },
  },
  Tier3: {
    "Win 5 Games": {
      ID: "Hard1",
      internal: ["Win5Games"],
      description: "Win 5 games with no vegs or leavers.",
      reward: 10,
    },
    "Win 3 games in a row": {
      ID: "Hard2",
      internal: ["Win3GamesInRow"],
      description: "Win 3 games with no vegs or leavers in a row (Games with vegs/leavers will not disrupt the win streak).",
      reward: 10,
    },
    "Earn a Kudos": {
      ID: "Hard3",
      internal: ["GetKudos"],
      description: "Earn a Kudo.",
      reward: 10,
    },
    "Win in 3 diffrent game types": {
      ID: "Hard4",
      internal: ["WinDiffrentGameTypes"],
      description: "Win 3 games with no vegs or leavers in 3 diffrent game types.",
      reward: 10,
    },
    "Win in 3 diffrent setups": {
      ID: "Hard5",
      internal: ["WinDiffrentGameTypes"],
      description: "Win 3 games with no vegs or leavers in 3 diffrent mafia setups.",
      reward: 10,
      incompatible: ["Basic3"],
    },
  },
Tier4: {
    "Quote 5 Messages": {
      ID: "Joke1",
      internal: ["Quote5"],
      description: "Quote 5 Messages in a game with no vegs or leavers.",
      reward: 1,
    },
    "Correctly vote Mafia": {
      ID: "Joke2",
      internal: ["Quote5"],
      description: "Vote for a Mafia-aligned player as a Village-aligned role.",
      reward: 2,
    },
    "Use 30 Guns": {
      ID: "Joke3",
      internal: ["Gun30"],
      description: "Use a Gun 30 times.",
      reward: 5,
    },
  },
};

//export const achievementList = AchievementData

module.exports = DailyChallengeData;
