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
      description: "As Villager, correctly vote on Evil players for 3 days.",
      reward: 20,
      roles: ["Villager"],
    },
    "Nothing To See Here": {
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
    "New Sheriff In Town": {
      ID: "Mafia9",
      internal: ["SheriffShootEvil"],
      description: "As Sheriff, shoot and kill an Evil player.",
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
        "As Deputy, shoot and kill an Evil player who is carrying a Gun or Rifle.",
      reward: 30,
      roles: ["Deputy"],
    },
    "Crime Doesn't Pay": {
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
    "Clean It Up, Janny": {
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
    "Let The Record Show": {
      ID: "Mafia19",
      internal: ["LawyerFrame"],
      description:
        "As Lawyer, make a player show as guilty on a Cop/Detective report.",
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
    "Eye Of Vigilance": {
      ID: "Mafia23",
      internal: ["VigilanteKill"],
      description: "As Vigilante, kill 2 Evil players.",
      reward: 20,
      roles: ["Vigilante"],
    },
    "Big Iron": {
      ID: "Mafia24",
      internal: ["GunsmithGun"],
      description:
        "As Gunsmith, give a gun to a player who shoots an Evil player.",
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
    "Rigged From The Start": {
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
    "On The Trail": {
      ID: "Mafia32",
      internal: ["TrackerCheck"],
      description: "As Tracker, track a player who visits you.",
      reward: 10,
      roles: ["Tracker"],
    },
    "If It Doesn't Fit": {
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
    "The Master Has Become The Student": {
      ID: "Mafia35",
      internal: ["PedagoguePedagogue"],
      description: "As Pedagogue, Retrain a Pedagogue who is retraining you.",
      reward: 30,
      roles: ["Pedagogue"],
    },
    "Silence Is Deafening": {
      ID: "Mafia36",
      internal: ["SilencerSilence2PR"],
      description:
        "As Silencer, Silence 2 different village power roles during a game.",
      reward: 15,
      roles: ["Silencer"],
    },
    "Tell Me About Your Mother": {
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
    "Hell In A Cell": {
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
    "Sink or Swim": {
      ID: "Mafia41",
      internal: ["LifeguardPRSave"],
      description:
        "As Lifeguard, have your master be a surviving Village power role at the end of the game.",
      reward: 20,
      roles: ["Lifeguard"],
    },
    "Off With Your Head": {
      ID: "Mafia42",
      internal: ["QueenCondemned"],
      description: "Survive and win in a game where the Queen was condemned.",
      reward: 10,
    },
    "Burn Book": {
      ID: "Mafia43",
      internal: ["DramaQueenRevealEvil"],
      description:
        "As Drama Queen, have an Evil-aligned player be revealed via your drama.",
      reward: 20,
      roles: ["Drama Queen"],
    },
    "Put On The Red Light": {
      ID: "Mafia44",
      internal: ["HookerBlock2PR"],
      description:
        "As Hooker, successfully roleblock 2 different Village power roles during a game.",
      reward: 15,
      roles: ["Hooker"],
    },
    "As Above": {
      ID: "Mafia45",
      internal: ["MagusWinDayOne"],
      description: "As Magus, win after a Magus game is declared on Day 1.",
      reward: 40,
      roles: ["Magus"],
    },
    "Just The Two Of Us": {
      ID: "Mafia46",
      internal: ["LoverFinalTwo"],
      description: "As Lover, be alive in the final 2.",
      reward: 20,
      roles: ["Lover"],
    },
    "First Flame": {
      ID: "Mafia47",
      internal: ["ArsonistIgniteDayOne"],
      description: "As Arsonist, ignite a Village power role on Day 1.",
      reward: 20,
      roles: ["Arsonist"],
    },
    "Falling Into Place": {
      ID: "Mafia48",
      internal: ["SirenBeckonTwo"],
      description:
        "As Siren, successfully beckon 2 different roles to visit you and survive to the end of the game.",
      reward: 20,
      roles: ["Siren"],
    },
    "Eye Of The Beholder": {
      ID: "Mafia49",
      internal: ["OracleRevealEvil"],
      description: "As Oracle, have your death reveal an Evil-aligned player.",
      reward: 20,
      roles: ["Oracle"],
    },
    "Happy Hour": {
      ID: "Mafia50",
      internal: ["DrunkBlockEvil"],
      description:
        "As Drunk, roleblock an Evil power role that was targeting you.",
      reward: 20,
      roles: ["Drunk"],
    },
    "Judge, Jury And Executioner": {
      ID: "Mafia51",
      internal: ["JailerCleanExecutions"],
      description:
        "As Jailer, execute at least one Evil player and never execute a non-Evil player.",
      reward: 20,
      roles: ["Jailer"],
    },
    "Feeling Blue": {
      ID: "Mafia52",
      internal: ["LobotomistAllVPR"],
      description:
        "As Lobotomist, convert every Village power role in the game.",
      reward: 30,
      roles: ["Lobotomist"],
    },
    "Bleeding Heart": {
      ID: "Mafia53",
      internal: ["HeartbreakerCondemnedLove"],
      description:
        "As Heartbreaker, have your Village-aligned Love be condemned.",
      reward: 20,
      roles: ["Heartbreaker"],
    },
    Governator: {
      ID: "Mafia54",
      internal: ["GovernatorFlip"],
      description:
        "As Governor, overturn a non-Evil condemnation and land your kill on a Mafia player.",
      reward: 20,
      roles: ["Governor"],
    },
    "Guys, I'm So Obvious": {
      ID: "Mafia55",
      internal: ["DisguiserTwoSurvive"],
      description:
        "As Disguiser, steal another player's identity twice and survive to the end of the game.",
      reward: 10,
      roles: ["Disguiser"],
    },
    Kevlar: {
      ID: "Mafia56",
      internal: ["SurviveBulletproof"],
      description:
        "As a Bulletproof player, have your armor save you from a night kill.",
      reward: 15,
    },
    "Explosion!": {
      ID: "Mafia57",
      internal: ["ExplosiveRetaliation"],
      description:
        "As an Explosive player, kill a Mafia-aligned player with your bomb's retaliation.",
      reward: 20,
    },
    "True Path": {
      ID: "Mafia58",
      internal: ["SamuraiKillConverter"],
      description:
        "As Samurai, kill a Cult-aligned converter in your duel.",
      reward: 30,
      roles: ["Samurai"],
    },
    "Mayor And Orders": {
      ID: "Mafia59",
      internal: ["MayorRevealWin"],
      description: "As Mayor, reveal yourself and win.",
      reward: 20,
      roles: ["Mayor"],
    },
    "Pulling The Strings": {
      ID: "Mafia60",
      internal: ["WitchRedirectEvilKill"],
      description:
        "As Witch, redirect a kill so that an Evil player kills another Evil player.",
      reward: 30,
      roles: ["Witch"],
    },
    "Fresh Blood": {
      ID: "Mafia61",
      internal: ["VampireTwoKills"],
      description: "As Vampire, kill 2 players with your Vampire meeting.",
      reward: 20,
      roles: ["Vampire"],
    },
    "Full Moon": {
      ID: "Mafia62",
      internal: ["WerewolfFullMoonKills"],
      description: "As Werewolf, cause 3 deaths during a single Full Moon.",
      reward: 30,
      roles: ["Werewolf"],
    },
    "Last One Standing": {
      ID: "Mafia63",
      internal: ["SerialKillerSoleSurvivor"],
      description: "As Serial Killer, win as the last player alive.",
      reward: 30,
      roles: ["Serial Killer"],
    },
    "Harvest Moon": {
      ID: "Mafia64",
      internal: ["ReaperWinByChoice"],
      description: "As Reaper, win by selecting a surviving target.",
      reward: 20,
      roles: ["Reaper"],
    },
    "Second Wind": {
      ID: "Mafia65",
      internal: ["NecromancerRaiseCult"],
      description:
        "As Necromancer, kill a Cult player and raise them as an undead.",
      reward: 20,
      roles: ["Necromancer"],
    },
    "Can't Touch This": {
      ID: "Mafia66",
      internal: ["SurvivorUnvisited"],
      description:
        "As Survivor, survive to the end of the game without being visited at night.",
      reward: 20,
      roles: ["Survivor"],
    },
    "First Contact": {
      ID: "Mafia67",
      internal: ["AlienThreeProbes"],
      description: "As Alien, successfully probe 3 different players.",
      reward: 20,
      roles: ["Alien"],
    },
    "Soul Insurance": {
      ID: "Mafia68",
      internal: ["LichHauntAndWin"],
      description: "As Lich, select a vessel and win.",
      reward: 20,
      roles: ["Lich"],
    },
    "Ph'nglui mglw'nafh": {
      ID: "Mafia69",
      internal: ["CthulhuThreeInsane"],
      description: "As Cthulhu, drive 3 different players insane.",
      reward: 20,
      roles: ["Cthulhu"],
    },
    Consumed: {
      ID: "Mafia70",
      internal: ["BlobThreeAbsorbs"],
      description: "As Blob, absorb 3 players.",
      reward: 20,
      roles: ["Blob"],
    },
    Assimilation: {
      ID: "Mafia71",
      internal: ["GreyGooThreeConverts"],
      description: "As Grey Goo, create 3 other Grey Goos.",
      reward: 30,
      roles: ["Grey Goo"],
    },
    "Divine Right": {
      ID: "Mafia72",
      internal: ["EmperorDecreeWin"],
      description: "As Emperor, win by successfully calling two duels.",
      reward: 20,
      roles: ["Emperor"],
    },
    "Caped Crusader": {
      ID: "Mafia73",
      internal: ["SuperheroWin"],
      description: "As Superhero, win the game.",
      reward: 15,
      roles: ["Superhero"],
    },
    "World Domination": {
      ID: "Mafia74",
      internal: ["SupervillainWin"],
      description: "As Supervillain, win the game.",
      reward: 15,
      roles: ["Supervillain"],
    },
    "Cold Snap": {
      ID: "Mafia75",
      internal: ["SnowmanThreeFreezes"],
      description: "As Snowman, have 3 players die from Snowballs.",
      reward: 20,
      roles: ["Snowman"],
    },
    "Walk It Off": {
      ID: "Mafia76",
      internal: ["MachoDieAndWin"],
      description: "As a Macho player, die during the game and still win.",
      reward: 15,
    },
    "'Til Death": {
      ID: "Mafia77",
      internal: ["MarriedPartnerDies"],
      description:
        "As a Married player, survive and win after your partner dies.",
      reward: 20,
    },
    "Wild Card": {
      ID: "Mafia78",
      internal: ["ChaoticRerollWin"],
      description:
        "As a Chaotic player, be converted to a new role and win.",
      reward: 20,
    },
    "Spotlight Thief": {
      ID: "Mafia79",
      internal: ["BraggadociousSoloWin"],
      description:
        "As a Braggadocious player, win solo as an Independent role.",
      reward: 30,
    },
    "Jack Of All Trades": {
      ID: "Mafia80",
      internal: ["AllAlignmentWins"],
      description:
        "Win at least once as a Village, Mafia, Cult, and Independent role.",
      reward: 30,
    },
    "Role Tourist": {
      ID: "Mafia81",
      internal: ["TenRoleAchievements"],
      description:
        "Earn role-specific achievements for 10 different roles.",
      reward: 40,
    },
    "Century Club": {
      ID: "Mafia82",
      internal: ["PlayedOneHundred"],
      description: "Play 100 Mafia games.",
      reward: 30,
    },
    Completionist: {
      ID: "Mafia83",
      internal: ["TwentyFiveAchievements"],
      description: "Earn 25 distinct Mafia achievements.",
      reward: 50,
    },
  },
  Resistance: {},
  Jotto: {},
  Acrotopia: {},
  "Secret Dictator": {},
  "Wacky Words": {},
  "Liars Dice": {},
  "Texas Hold Em": {},
  Cheat: {},
  "Connect Four": {},
  "Spot It": {},
  Ratscrew: {},
  // TODO Wave 8 verify schema — listener classes for `internal` entries are
  // not yet created under Games/types/DrawIt/achievements/. Grants are wired
  // inline in Games/types/DrawIt/Game.js for now.
  "Draw It": {
    "Crystal Clear": {
      ID: "DrawIt3",
      internal: ["CrystalClear"],
      description:
        "As the drawer, earn 10 points (max average) on a single turn.",
      reward: 20,
    },
    Bullseye: {
      ID: "DrawIt4",
      internal: ["Bullseye"],
      description: "Be the first to guess correctly 5 times in one Draw It game.",
      reward: 20,
    },
  },
};

//export const achievementList = AchievementData

module.exports = AchievementData;
