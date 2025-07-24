//DO NOT CHANGE THE IDs
//const AchievementData = require("../react_main/src/constants/Achievements");
//DO NOT CHANGE THE IDs
//DO NOT CHANGE THE IDs

const AchievementData = {
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
      reward: 20,
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
    "Even Death May Die": {
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
      reward: 20,
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
      reward: 30,
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
        "As Fiddler, Fiddle 2 different village power roles during a game.",
      reward: 15,
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
    "Vanishing Twin Syndrome": {
      ID: "Mafia16",
      internal: ["ChangelingWin"],
      description:
        "As Changeling, win by using the Changeling's alternate win condition.",
      reward: 20,
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
      reward: 20,
      roles: ["Dodo"],
    },
    "It was Them!": {
      ID: "Mafia19",
      internal: ["LawyerFrame"],
      description:
        "As Lawyer, make a player shows as guilty on a Cop/Detective report.",
      reward: 20,
      roles: ["Lawyer"],
    },
    "Elementary, Watson": {
      ID: "Mafia20",
      internal: ["DetectiveCheck2"],
      description:
        "As Detective, find 2 evil players and survive until the end of the game.",
      reward: 30,
      roles: ["Detective"],
    },
    "Not On My Watch!": {
      ID: "Mafia21",
      internal: ["BodyguardKill"],
      description: "As Bodyguard, kill an evil player with your ability.",
      reward: 10,
      roles: ["Bodyguard"],
    },
    "Do No Harm": {
      ID: "Mafia22",
      internal: ["DoctorSave"],
      description:
        "As Doctor, save a Village-aligned player from being killed.",
      reward: 10,
      roles: ["Doctor"],
    },
    "I am the Night": {
      ID: "Mafia23",
      internal: ["VigilanteKill"],
      description: "As Vigilante, kill 2 evil players.",
      reward: 20,
      roles: ["Vigilante"],
    },
    "They are the Night": {
      ID: "Mafia24",
      internal: ["GunsmithGun"],
      description:
        "As Gunsmith, Give a gun to a player who shoots an Evil Player.",
      reward: 15,
      roles: ["Gunsmith"],
    },
    Quickscope: {
      ID: "Mafia25",
      internal: ["SniperShootGunnedPR"],
      description:
        "As Sniper, shoot and kill a Village power role who is carrying a gun/rifle.",
      reward: 30,
      roles: ["Sniper"],
    },
    "Rigged from the Start": {
      ID: "Mafia26",
      internal: ["SaboteurKill"],
      description:
        "As Saboteur, have a player you sabotaged die to a sabotaged gun.",
      reward: 15,
      roles: ["Saboteur"],
    },
    "Magic Words": {
      ID: "Mafia27",
      internal: ["JinxKill"],
      description: "As Jinx, get 2 kills with your ability.",
      reward: 20,
      roles: ["Jinx"],
    },
    Untouchable: {
      ID: "Mafia28",
      internal: ["MastermindPerfect"],
      description: "As Mastermind, win without any Mafia or Cult dying.",
      reward: 30,
      roles: ["Mastermind"],
    },
    "Balanced Breakfast": {
      ID: "Mafia29",
      internal: ["HellhoundEat"],
      description:
        "As Hellhound, Eat 2 players from different alignments and win.",
      reward: 30,
      roles: ["Hellhound"],
    },
    "Delirious Desires": {
      ID: "Mafia30",
      internal: ["SuccubusFalse"],
      description:
        "As Succubus, make a player's system messages return false 3 times in a game.",
      reward: 20,
      roles: ["Succubus"],
    },
    Eyewitness: {
      ID: "Mafia31",
      internal: ["WatcherCheck2"],
      description:
        "As Watcher, see Evil players visiting twice and survive until the end of the game.",
      reward: 30,
      roles: ["Watcher"],
    },
    "On the Trail": {
      ID: "Mafia32",
      internal: ["TrackerCheck"],
      description: "As Tracker, track a player who visits you.",
      reward: 10,
      roles: ["Tracker"],
    },
    "I'm Towntelling!": {
      ID: "Mafia33",
      internal: ["MillerTowntell"],
      description:
        "As Miller, survive and win after being checked by a Cop or Detective.",
      reward: 20,
      roles: ["Miller"],
    },
    "So Below": {
      ID: "Mafia34",
      internal: ["DeclareMagusAsEvil"],
      description:
        "As a Mafia or Cult role, convince the Village to Declare a Magus game.",
      reward: 40,
    },
    "The Master has become the Student": {
      ID: "Mafia35",
      internal: ["PedagoguePedagogue"],
      description: "As Pedagogue, Retrain a Pedagogue who is retraining you.",
      reward: 30,
      roles: ["Pedagogue"],
    },
    "Duct Tape is Helpful": {
      ID: "Mafia36",
      internal: ["SilencerSilence2PR"],
      description:
        "As Silencer, Silence 2 different village power roles during a game.",
      reward: 15,
      roles: ["Silencer"],
    },
    "Psychoanalyze Me!": {
      ID: "Mafia37",
      internal: ["ShrinkSaveTwice"],
      description: "As Shrink, Prevent 2 conversions.",
      reward: 20,
      roles: ["Shrink"],
    },
    "Household Homicide!": {
      ID: "Mafia38",
      internal: ["GrannyKills"],
      description: "As Granny, kill 2 Evil players in a single night.",
      reward: 20,
      roles: ["Granny"],
    },
    "Clean it Up, Undie": {
      ID: "Mafia39",
      internal: ["UndertakerCleanPR"],
      description: "As Undertaker, clean a Village power role.",
      reward: 10,
      roles: ["Undertaker"],
    },
    "Ultimate Sacrifice": {
      ID: "Mafia40",
      internal: ["HunterKill"],
      description: "As Hunter, Kill an Evil player when 3 players are alive.",
      reward: 20,
      roles: ["Hunter"],
    },
  },
  Resistance: {},
  Ghost: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Wacky Words": {},
  "Liars Dice": {},
  "Card Games": {},
  "Cheat": {},
};

//export const achievementList = AchievementData

module.exports = AchievementData;
