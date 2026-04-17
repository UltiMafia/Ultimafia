process.env.NODE_ENV = process.env.NODE_ENV || "development";

const chai = require("chai");
const should = chai.should();
const EventEmitter = require("events");

// Each test instantiates one achievement listener with a hand-built mock
// game/player, fires the event(s) the listener cares about, and asserts
// that the achievement ID lands in player.EarnedAchievements. We avoid
// spinning up a full Game (which would require Mongo + Redis + the
// achievementsAllowed gate that's only true for ranked/competitive games).

const ACH_DIR = "../../Games/types/Mafia/achievements/";

function makeEnv(opts = {}) {
  const events = new EventEmitter();
  events.setMaxListeners(50);
  const game = {
    events,
    actions: [opts.preActions || []],
    players: [],
    stateEvents: opts.stateEvents || {},
    winners: { groups: opts.winners || {} },
    finished: false,
    type: "Mafia",
    alivePlayers: opts.alivePlayers || (() => game.players.filter((p) => p.alive)),
    getRoleAlignment: (name) =>
      (opts.alignmentMap && opts.alignmentMap[name]) || "Village",
    getStateName: opts.getStateName || (() => "Day"),
    getStateInfo: opts.getStateInfo || (() => ({ dayCount: 1, name: "Day 1" })),
    queueAction(action) {
      this.actions[0].push(action);
      try { action.run(); } catch (e) { /* surface only on assertion failure */ }
    },
    instantAction(action) {
      try { action.run(); } catch (e) {}
    },
  };
  game.MagusGameDeclared = opts.MagusGameDeclared;

  const player = makePlayer({
    roleName: opts.roleName,
    modifier: opts.modifier,
    alive: opts.alive,
    roleData: opts.roleData,
    roleExtras: opts.roleExtras,
    isEvil: opts.isEvil,
    user: opts.user,
    faction: opts.faction,
    game,
  });
  game.players.push(player);
  for (let extra of opts.extraPlayers || []) {
    extra.game = game;
    game.players.push(extra);
  }
  return { game, player, events };
}

function makePlayer(opts) {
  return {
    role: {
      name: opts.roleName,
      modifier: opts.modifier,
      data: opts.roleData || {},
      ...(opts.roleExtras || {}),
    },
    alive: opts.alive !== false,
    EarnedAchievements: [],
    user: opts.user || { achievements: [], gamesPlayed: 0, stats: {} },
    isEvil: opts.isEvil || (() => false),
    faction: opts.faction,
    game: opts.game,
  };
}

function mockAction(opts) {
  return {
    actor: opts.actor,
    target: opts.target,
    labels: opts.labels || [],
    HasBeenSavedByArmor: opts.HasBeenSavedByArmor,
    hasLabel(l) { return this.labels.includes(l); },
    hasLabels(ls) { return ls.every((l) => this.labels.includes(l)); },
    dominates() { return opts.dominates !== false; },
    getVisitors: opts.getVisitors,
  };
}

function instantiate(filename, player) {
  const Klass = require(ACH_DIR + filename);
  const ach = new Klass("TestAch", player);
  ach.start();
  return ach;
}

function won(game, player) {
  game.winners.groups["Test"] = [player];
}

describe("Mafia Achievements (Mafia41-Mafia83)", function () {
  describe("Mafia41 Sink or Swim (LifeguardPRSave)", function () {
    it("awards if Lifeguard's master is alive Village PR and they win", function () {
      const master = makePlayer({ roleName: "Sheriff", alive: true });
      const { game, player } = makeEnv({
        roleName: "Lifeguard",
        roleData: { master },
        alignmentMap: { Sheriff: "Village" },
      });
      won(game, player);
      instantiate("LifeguardPRSave", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia41");
    });
    it("does not award if master is a plain Villager", function () {
      const master = makePlayer({ roleName: "Villager", alive: true });
      const { game, player } = makeEnv({
        roleName: "Lifeguard",
        roleData: { master },
        alignmentMap: { Villager: "Village" },
      });
      won(game, player);
      instantiate("LifeguardPRSave", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.not.include("Mafia41");
    });
  });

  describe("Mafia42 Off With Your Head (QueenCondemned)", function () {
    it("awards when a Queen is condemned and player wins alive", function () {
      const queen = makePlayer({ roleName: "Queen" });
      const { game, player } = makeEnv({ roleName: "Cop" });
      won(game, player);
      instantiate("QueenCondemned", player);
      game.events.emit("death", queen, null, "condemn");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia42");
    });
  });

  describe("Mafia43 Burn Book (DramaQueenRevealEvil)", function () {
    it("awards when Drama Queen reveals an evil target", function () {
      const evilTarget = makePlayer({ roleName: "Mafioso", isEvil: () => true });
      const { game, player } = makeEnv({ roleName: "Drama Queen" });
      instantiate("DramaQueenRevealEvil", player);
      game.events.emit("Information", {
        creator: player,
        name: "Reveal Info",
        target: evilTarget,
      });
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia43");
    });
  });

  describe("Mafia44 Put On The Red Light (HookerBlock2PR)", function () {
    it("awards after blocking 2 distinct Village PRs", function () {
      const cop = makePlayer({ roleName: "Cop" });
      const doctor = makePlayer({ roleName: "Doctor" });
      const { game, player } = makeEnv({
        roleName: "Hooker",
        alignmentMap: { Cop: "Village", Doctor: "Village" },
      });
      instantiate("HookerBlock2PR", player);

      game.actions[0].push(mockAction({ actor: player, target: cop, labels: ["block"] }));
      game.events.emit("state", { name: "Night 1" });

      game.actions[0] = [
        mockAction({ actor: player, target: doctor, labels: ["block"] }),
      ];
      game.events.emit("state", { name: "Night 2" });

      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia44");
    });
  });

  describe("Mafia45 As Above (MagusWinDayOne)", function () {
    it("awards when Magus wins on Day 1 after a Magus declaration", function () {
      const { game, player } = makeEnv({
        roleName: "Magus",
        MagusGameDeclared: true,
        getStateInfo: () => ({ dayCount: 1, name: "Day 1" }),
      });
      won(game, player);
      instantiate("MagusWinDayOne", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia45");
    });
  });

  describe("Mafia46 Just The Two Of Us (LoverFinalTwo)", function () {
    it("awards Lover when only 2 players remain alive", function () {
      const other = makePlayer({ roleName: "Cop" });
      const { game, player } = makeEnv({
        roleName: "Lover",
        extraPlayers: [other],
      });
      instantiate("LoverFinalTwo", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia46");
    });
  });

  describe("Mafia47 First Flame (ArsonistIgniteDayOne)", function () {
    it("awards when Arsonist burns a Village PR on Day 1", function () {
      const cop = makePlayer({ roleName: "Cop" });
      const { game, player } = makeEnv({
        roleName: "Arsonist",
        alignmentMap: { Cop: "Village" },
        getStateInfo: () => ({ dayCount: 1, name: "Dusk 1" }),
      });
      instantiate("ArsonistIgniteDayOne", player);
      game.events.emit("death", cop, player, "burn");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia47");
    });
  });

  describe("Mafia48 Falling Into Place (SirenBeckonTwo)", function () {
    it("awards when Siren beckons 2 distinct roles and survives", function () {
      const cop = makePlayer({ roleName: "Cop" });
      const doctor = makePlayer({ roleName: "Doctor" });
      const { game, player } = makeEnv({ roleName: "Siren" });
      instantiate("SirenBeckonTwo", player);

      game.actions[0].push(mockAction({ actor: player, target: cop, labels: ["kill"] }));
      game.events.emit("state", { name: "Night 1" });

      game.actions[0] = [mockAction({ actor: player, target: doctor, labels: ["kill"] })];
      game.events.emit("state", { name: "Night 2" });

      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia48");
    });
  });

  describe("Mafia49 Eye Of The Beholder (OracleRevealEvil)", function () {
    it("awards if dead Oracle's reveal points to evil", function () {
      const evil = makePlayer({ roleName: "Mafioso", isEvil: () => true });
      const { game, player } = makeEnv({ roleName: "Oracle", alive: false });
      instantiate("OracleRevealEvil", player);
      game.events.emit("Information", {
        creator: player,
        name: "Reveal Info",
        target: evil,
      });
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia49");
    });
  });

  describe("Mafia50 Happy Hour (DrunkBlockEvil)", function () {
    it("awards when Drunk blocks an evil PR who was visiting them", function () {
      const sk = makePlayer({ roleName: "Serial Killer", isEvil: () => true });
      const { game, player } = makeEnv({
        roleName: "Drunk",
        alignmentMap: { "Serial Killer": "Independent" },
      });
      instantiate("DrunkBlockEvil", player);
      game.actions[0].push(mockAction({ actor: player, target: sk, labels: ["block"] }));
      game.actions[0].push(mockAction({ actor: sk, target: player, labels: ["kill"] }));
      game.events.emit("state", { name: "Night 1" });
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia50");
    });
  });

  describe("Mafia51 Judge, Jury And Executioner (JailerCleanExecutions)", function () {
    it("awards when only-evil prisoners are executed", function () {
      const evil = makePlayer({ roleName: "Mafioso", isEvil: () => true });
      const { game, player } = makeEnv({
        roleName: "Jailer",
        roleData: { prisoner: evil },
      });
      instantiate("JailerCleanExecutions", player);
      game.events.emit("death", evil, player, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia51");
    });
    it("does not award if Jailer ever kills an innocent prisoner", function () {
      const innocent = makePlayer({ roleName: "Cop", isEvil: () => false });
      const evil = makePlayer({ roleName: "Mafioso", isEvil: () => true });
      const { game, player } = makeEnv({ roleName: "Jailer" });
      instantiate("JailerCleanExecutions", player);
      player.role.data.prisoner = innocent;
      game.events.emit("death", innocent, player, "basic");
      player.role.data.prisoner = evil;
      game.events.emit("death", evil, player, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.not.include("Mafia51");
    });
  });

  describe("Mafia52 Feeling Blue (LobotomistAllVPR)", function () {
    it("awards when all initial VPRs are converted", function () {
      const cop = makePlayer({ roleName: "Cop" });
      const { game, player } = makeEnv({
        roleName: "Lobotomist",
        alignmentMap: { Cop: "Village", Lobotomist: "Mafia", Villager: "Village" },
        extraPlayers: [cop],
      });
      instantiate("LobotomistAllVPR", player);
      game.events.emit("start");
      game.actions[0].push(mockAction({ actor: player, target: cop, labels: ["convert"] }));
      game.events.emit("state", { name: "Night 1" });
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia52");
    });
  });

  describe("Mafia53 Bleeding Heart (HeartbreakerCondemnedLove)", function () {
    it("awards when Heartbreaker's love is condemned and is Village", function () {
      const lover = makePlayer({ roleName: "Cop" });
      const { game, player } = makeEnv({
        roleName: "Heartbreaker",
        roleExtras: { loves: lover },
        alignmentMap: { Cop: "Village" },
      });
      instantiate("HeartbreakerCondemnedLove", player);
      game.events.emit("death", lover, null, "condemn");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia53");
    });
  });

  describe("Mafia54 Governator (GovernatorFlip)", function () {
    it("awards when Governor overthrows a good lynch onto evil", function () {
      const goodVictim = makePlayer({ roleName: "Cop", isEvil: () => false });
      const evilVictim = makePlayer({ roleName: "Mafioso", isEvil: () => true });
      const { game, player } = makeEnv({ roleName: "Governor" });
      instantiate("GovernatorFlip", player);
      game.actions[0].push(mockAction({ target: goodVictim, labels: ["condemn"] }));
      game.actions[0].push(mockAction({ actor: player, target: evilVictim, labels: ["overthrow"] }));
      game.events.emit("state", { name: "Dusk 1" });
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia54");
    });
  });

  describe("Mafia55 Guys, I'm So Obvious (DisguiserTwoSurvive)", function () {
    it("awards when Disguiser steals identity twice and survives", function () {
      const target = makePlayer({ roleName: "Cop", alive: true });
      const { game, player } = makeEnv({ roleName: "Disguiser" });
      instantiate("DisguiserTwoSurvive", player);
      for (let i = 0; i < 2; i++) {
        game.actions[0] = [
          mockAction({ actor: player, target: "Yes", labels: ["stealIdentity"] }),
          mockAction({ actor: null, target, labels: ["kill", "mafia"] }),
        ];
        game.events.emit("state", { name: `Night ${i + 1}` });
      }
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia55");
    });
  });

  describe("Mafia56 Kevlar (SurviveBulletproof)", function () {
    it("awards when armor saves a Bulletproof player", function () {
      const { game, player } = makeEnv({ modifier: "Bulletproof" });
      instantiate("SurviveBulletproof", player);
      game.actions[0].push({ HasBeenSavedByArmor: true, target: player });
      game.events.emit("afterActions");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia56");
    });
    it("does not award without the Bulletproof modifier", function () {
      const { game, player } = makeEnv({ modifier: "" });
      instantiate("SurviveBulletproof", player);
      game.actions[0].push({ HasBeenSavedByArmor: true, target: player });
      game.events.emit("afterActions");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.not.include("Mafia56");
    });
  });

  describe("Mafia57 Explosion! (ExplosiveRetaliation)", function () {
    it("awards when an Explosive bomb kills a Mafia player", function () {
      const { game, player } = makeEnv({ modifier: "Explosive" });
      const killedMafia = makePlayer({ roleName: "Mafioso", faction: "Mafia" });
      instantiate("ExplosiveRetaliation", player);
      game.events.emit("death", killedMafia, player, "bomb");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia57");
    });
  });

  describe("Mafia58 True Path (SamuraiKillConverter)", function () {
    it("awards when Samurai kills a Cult-aligned target", function () {
      const cultist = makePlayer({ roleName: "Cultist" });
      const { game, player } = makeEnv({
        roleName: "Samurai",
        alignmentMap: { Cultist: "Cult" },
      });
      instantiate("SamuraiKillConverter", player);
      game.events.emit("death", cultist, player, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia58");
    });
  });

  describe("Mafia59 Mayor And Orders (MayorRevealWin)", function () {
    it("awards when Mayor wins after MayorWin flag is set", function () {
      const { game, player } = makeEnv({
        roleName: "Mayor",
        roleData: { MayorWin: true },
      });
      won(game, player);
      instantiate("MayorRevealWin", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia59");
    });
  });

  describe("Mafia60 Pulling The Strings (WitchRedirectEvilKill)", function () {
    it("awards on evil-on-evil kill following a Witch redirect", function () {
      const mafioso = makePlayer({ roleName: "Mafioso", isEvil: () => true });
      const cultist = makePlayer({ roleName: "Cultist", isEvil: () => true });
      const { game, player } = makeEnv({
        roleName: "Witch",
        roleData: { controlledActor: mafioso },
      });
      instantiate("WitchRedirectEvilKill", player);
      game.events.emit("state", { name: "Night 1" });
      game.events.emit("death", cultist, mafioso, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia60");
    });
  });

  describe("Mafia61 Fresh Blood (VampireTwoKills)", function () {
    it("awards Vampire after 2 confirmed kills", function () {
      const v1 = makePlayer({ roleName: "Cop" });
      const v2 = makePlayer({ roleName: "Doctor" });
      const { game, player } = makeEnv({ roleName: "Vampire" });
      instantiate("VampireTwoKills", player);
      game.events.emit("death", v1, player, "basic");
      game.events.emit("death", v2, player, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia61");
    });
  });

  describe("Mafia62 Full Moon (WerewolfFullMoonKills)", function () {
    it("awards when Werewolf causes 3 deaths during a Full Moon", function () {
      const targets = [0, 1, 2].map(() => makePlayer({ roleName: "Cop" }));
      const { game, player } = makeEnv({ roleName: "Werewolf" });
      game.stateEvents["Full Moon"] = true;
      instantiate("WerewolfFullMoonKills", player);
      for (let t of targets) game.events.emit("death", t, player, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia62");
    });
  });

  describe("Mafia63 Last One Standing (SerialKillerSoleSurvivor)", function () {
    it("awards SK as the only surviving player", function () {
      const { game, player } = makeEnv({ roleName: "Serial Killer" });
      instantiate("SerialKillerSoleSurvivor", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia63");
    });
  });

  describe("Mafia64 Harvest Moon (ReaperWinByChoice)", function () {
    it("awards Reaper when ReaperWin is set and player wins", function () {
      const { game, player } = makeEnv({ roleName: "Reaper" });
      player.role.ReaperWin = true;
      won(game, player);
      instantiate("ReaperWinByChoice", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia64");
    });
  });

  describe("Mafia65 Second Wind (NecromancerRaiseCult)", function () {
    it("awards when Necromancer kills a Cult-aligned player", function () {
      const cultist = makePlayer({ roleName: "Cultist" });
      const { game, player } = makeEnv({
        roleName: "Necromancer",
        alignmentMap: { Cultist: "Cult" },
      });
      instantiate("NecromancerRaiseCult", player);
      game.events.emit("death", cultist, player, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia65");
    });
  });

  describe("Mafia66 Can't Touch This (SurvivorUnvisited)", function () {
    it("awards Survivor with no visitors and a win", function () {
      const { game, player } = makeEnv({ roleName: "Survivor" });
      won(game, player);
      instantiate("SurvivorUnvisited", player);
      game.events.emit("actionsNext", []);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia66");
    });
    it("does not award if visited", function () {
      const visitor = makePlayer({ roleName: "Cop" });
      const { game, player } = makeEnv({ roleName: "Survivor" });
      won(game, player);
      instantiate("SurvivorUnvisited", player);
      game.events.emit("actionsNext", [
        mockAction({ actor: visitor, target: player, labels: ["check"] }),
      ]);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.not.include("Mafia66");
    });
  });

  describe("Mafia67 First Contact (AlienThreeProbes)", function () {
    it("awards Alien for probing 3 distinct players", function () {
      const probed = [0, 1, 2].map(() => makePlayer({ roleName: "Cop" }));
      const { game, player } = makeEnv({ roleName: "Alien" });
      instantiate("AlienThreeProbes", player);
      for (let i = 0; i < 3; i++) {
        game.actions[0] = [
          mockAction({ actor: player, target: probed[i], labels: ["effect", "probe"] }),
        ];
        game.events.emit("state", { name: `Night ${i + 1}` });
      }
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia67");
    });
  });

  describe("Mafia68 Soul Insurance (LichHauntAndWin)", function () {
    it("awards Lich who chose a vessel and won", function () {
      const vessel = makePlayer({ roleName: "Cop" });
      const { game, player } = makeEnv({
        roleName: "Lich",
        roleData: { DreamHost: vessel },
      });
      won(game, player);
      instantiate("LichHauntAndWin", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia68");
    });
  });

  describe("Mafia69 Ph'nglui mglw'nafh (CthulhuThreeInsane)", function () {
    it("awards Cthulhu for driving 3 distinct visitors insane", function () {
      const insane = [0, 1, 2].map(() => makePlayer({ roleName: "Cop" }));
      const { game, player } = makeEnv({ roleName: "Cthulhu" });
      instantiate("CthulhuThreeInsane", player);
      game.actions[0] = [
        mockAction({
          actor: player,
          target: player,
          labels: ["giveEffect", "insanity"],
          getVisitors: () => insane,
        }),
      ];
      game.events.emit("state", { name: "Night 1" });
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia69");
    });
  });

  describe("Mafia70 Consumed (BlobThreeAbsorbs)", function () {
    it("awards Blob for 3+ BlobKills", function () {
      const { game, player } = makeEnv({ roleName: "Blob" });
      player.role.BlobKills = 3;
      instantiate("BlobThreeAbsorbs", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia70");
    });
  });

  describe("Mafia71 Assimilation (GreyGooThreeConverts)", function () {
    it("awards Grey Goo for converting 3 players", function () {
      const targets = [0, 1, 2].map(() => makePlayer({ roleName: "Cop" }));
      const { game, player } = makeEnv({ roleName: "Grey Goo" });
      instantiate("GreyGooThreeConverts", player);
      for (let t of targets) {
        game.actions[0] = [
          mockAction({ actor: player, target: t, labels: ["convert", "seppuku"] }),
        ];
        game.events.emit("state", { name: "Night 1" });
      }
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia71");
    });
  });

  describe("Mafia72 Divine Right (EmperorDecreeWin)", function () {
    it("awards Emperor with 2+ correct duels who wins alive", function () {
      const { game, player } = makeEnv({ roleName: "Emperor" });
      player.role.predictedCorrect = 2;
      won(game, player);
      instantiate("EmperorDecreeWin", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia72");
    });
  });

  describe("Mafia73 Caped Crusader (SuperheroWin)", function () {
    it("awards Superhero who wins", function () {
      const { game, player } = makeEnv({ roleName: "Superhero" });
      won(game, player);
      instantiate("SuperheroWin", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia73");
    });
  });

  describe("Mafia74 World Domination (SupervillainWin)", function () {
    it("awards Supervillain who wins", function () {
      const { game, player } = makeEnv({ roleName: "Supervillain" });
      won(game, player);
      instantiate("SupervillainWin", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia74");
    });
  });

  describe("Mafia75 Cold Snap (SnowmanThreeFreezes)", function () {
    it("awards Snowman after 3 snowball deaths", function () {
      const victims = [0, 1, 2].map(() => makePlayer({ roleName: "Cop" }));
      const { game, player } = makeEnv({ roleName: "Snowman" });
      instantiate("SnowmanThreeFreezes", player);
      for (let v of victims) game.events.emit("death", v, null, "snowball");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia75");
    });
  });

  describe("Mafia76 Walk It Off (MachoDieAndWin)", function () {
    it("awards a dead Macho on the winning side", function () {
      const { game, player } = makeEnv({ modifier: "Macho", alive: false });
      won(game, player);
      instantiate("MachoDieAndWin", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia76");
    });
  });

  describe("Mafia77 'Til Death (MarriedPartnerDies)", function () {
    it("awards Married player who survives after partner dies", function () {
      const partner = makePlayer({ roleName: "Cop" });
      const { game, player } = makeEnv({ modifier: "Married" });
      player.role.partner = partner;
      won(game, player);
      instantiate("MarriedPartnerDies", player);
      game.events.emit("death", partner, null, "basic");
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia77");
    });
  });

  describe("Mafia78 Wild Card (ChaoticRerollWin)", function () {
    it("awards Chaotic player whose role changed and won", function () {
      const { game, player } = makeEnv({ roleName: "Lawyer", modifier: "Chaotic" });
      won(game, player);
      const ach = instantiate("ChaoticRerollWin", player);
      ach.OriginalRole.should.equal("Lawyer");
      player.role.name = "Sheriff"; // simulate Chaotic re-roll
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia78");
    });
  });

  describe("Mafia79 Spotlight Thief (BraggadociousSoloWin)", function () {
    it("awards Braggadocious independent who wins", function () {
      const { game, player } = makeEnv({
        roleName: "Survivor",
        modifier: "Braggadocious",
        alignmentMap: { Survivor: "Independent" },
      });
      won(game, player);
      instantiate("BraggadociousSoloWin", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia79");
    });
  });

  describe("Mafia80 Jack Of All Trades (AllAlignmentWins)", function () {
    it("awards when wins exist in every other alignment", function () {
      const stats = {
        Mafia: {
          all: {
            byAlignment: {
              Mafia: { wins: { count: 1 } },
              Cult: { wins: { count: 2 } },
              Independent: { wins: { count: 1 } },
            },
          },
        },
      };
      const { game, player } = makeEnv({
        roleName: "Cop",
        alignmentMap: { Cop: "Village" },
        user: { achievements: [], gamesPlayed: 4, stats },
      });
      won(game, player);
      instantiate("AllAlignmentWins", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia80");
    });
  });

  describe("Mafia81 Role Tourist (TenRoleAchievements)", function () {
    it("awards when 10 role-scoped achievements are accumulated", function () {
      // Skip Mafia42 (no roles filter); pick 10 role-scoped IDs.
      const ids = ["Mafia41", "Mafia43", "Mafia44", "Mafia45", "Mafia46",
                   "Mafia47", "Mafia48", "Mafia49", "Mafia50", "Mafia51"];
      const { game, player } = makeEnv({
        roleName: "Mayor",
        user: { achievements: ids, gamesPlayed: 10, stats: {} },
      });
      instantiate("TenRoleAchievements", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia81");
    });
  });

  describe("Mafia82 Century Club (PlayedOneHundred)", function () {
    it("awards on the 100th game", function () {
      const { game, player } = makeEnv({
        roleName: "Cop",
        user: { achievements: [], gamesPlayed: 99, stats: {} },
      });
      instantiate("PlayedOneHundred", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia82");
    });
    it("does not award before 100", function () {
      const { game, player } = makeEnv({
        roleName: "Cop",
        user: { achievements: [], gamesPlayed: 50, stats: {} },
      });
      instantiate("PlayedOneHundred", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.not.include("Mafia82");
    });
  });

  describe("Mafia83 Completionist (TwentyFiveAchievements)", function () {
    it("awards once 25 distinct achievements are held", function () {
      const ids = Array.from({ length: 25 }, (_, i) => `Mafia${i + 1}`);
      const { game, player } = makeEnv({
        roleName: "Cop",
        user: { achievements: ids, gamesPlayed: 30, stats: {} },
      });
      instantiate("TwentyFiveAchievements", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.include("Mafia83");
    });
    it("does not award when below 25", function () {
      const { game, player } = makeEnv({
        roleName: "Cop",
        user: { achievements: ["Mafia1", "Mafia2"], gamesPlayed: 5, stats: {} },
      });
      instantiate("TwentyFiveAchievements", player);
      game.events.emit("aboutToFinish");
      player.EarnedAchievements.should.not.include("Mafia83");
    });
  });
});
