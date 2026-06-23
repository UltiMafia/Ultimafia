const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const db = require("../../db/db");
const redis = require("../../modules/redis");
const shortid = require("shortid");
const Game = require("../../Games/types/Mafia/Game");
const MafiaWinners = require("../../Games/types/Mafia/Winners");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const models = require("../../db/models");

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

function makeUsers(amt) {
  const users = [];
  for (let i = 0; i < amt; i++) users.push(makeUser());
  return users;
}

// checkGameStart() fires start() without awaiting, so ranked/competitive
// games (which do async heart charges inside start() before assignRoles)
// may not have reached the "started" state by the time the last userJoin
// resolves. Poll until roles are assigned on every player.
async function waitForRolesAssigned(game) {
  while (!game.finished) {
    let ready = game.started && game.players.length > 0;
    if (ready) {
      for (const p of game.players) {
        if (!p.role) {
          ready = false;
          break;
        }
      }
    }
    if (ready) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
}

async function makeGame(
  setup,
  { ranked = false, competitive = false, stateLength = 0, preJoinHook } = {}
) {
  const users = makeUsers(setup.total);
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup,
      ranked,
      competitive,
      stateLengths: { Day: stateLength, Night: stateLength },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();
  // Allow the caller to attach socket listeners before the game starts so
  // that onClientEvent doesn't have to replay any past "meeting" events
  // (which, combined with sync vote→meeting broadcasts, can spiral into a
  // runaway chain through the test socket).
  if (preJoinHook) preJoinHook({ game, users });
  for (const user of users) await game.userJoin(user);
  await waitForRolesAssigned(game);
  return { game, users };
}

function getRoles(game) {
  const roles = {};
  for (const player of game.players) {
    const roleName = player.role.name;
    if (!roles[roleName]) roles[roleName] = player;
    else if (Array.isArray(roles[roleName])) roles[roleName].push(player);
    else {
      roles[roleName] = [roles[roleName], player];
    }
  }
  return roles;
}

function addListenerToPlayers(players, eventName, action) {
  for (const player of players) {
    player.user.socket.onClientEvent(eventName, action);
  }
}

function waitForGameEnd(game) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      try {
        if (game.finished) {
          clearInterval(interval);
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    }, 20);
  });
}

// Village condemns the Mafioso → Village wins deterministically.
// Returns a preJoinHook that attaches a "meeting" listener to every user's
// socket BEFORE the game starts, so socket.onClientEvent has no past
// messages to replay and vote-induced meeting broadcasts go through the
// normal async state-transition path instead of chaining synchronously.
function autoVillageWin() {
  return ({ game, users }) => {
    // We can't resolve the Mafioso player.id until roles are assigned, so
    // we close over `game` and look it up lazily inside the handler.
    for (const user of users) {
      user.socket.onClientEvent("meeting", function (meeting) {
        if (meeting.name === "Village") {
          let mafioso = null;
          for (const p of game.players) {
            if (p.role && p.role.name === "Mafioso") {
              mafioso = p;
              break;
            }
          }
          this.sendToServer("vote", {
            selection: mafioso ? mafioso.id : "*",
            meetingId: meeting.id,
          });
        } else {
          this.sendToServer("vote", { selection: "*", meetingId: meeting.id });
        }
      });
    }
  };
}

// Attach a setup.id to the in-memory setup only when the test also seeds a
// matching Setup mongo doc. Attaching an id without seeding causes
// adjustSkillRatings / recordSetupStats to fail and spiral into error
// handlers that try to post to Discord, eventually OOMing.
function mafiaSetup({ id } = {}) {
  const setup = {
    total: 3,
    roles: [{ Villager: 2, Mafioso: 1 }],
  };
  if (id) setup.id = id;
  return setup;
}

async function seedUserDoc(user, { redHearts = 0, goldHearts = 0 } = {}) {
  return models.User.create({
    id: user.id,
    name: user.name,
    redHearts,
    goldHearts,
    stats: {},
  });
}

async function getUserDoc(user) {
  return models.User.findOne({ id: user.id }).lean();
}

async function seedSetupAndVersion(setupConfig, { ranked, competitive } = {}) {
  const setupDoc = await models.Setup.create({
    id: setupConfig.id,
    hash: shortid.generate(),
    name: "StatsTestSetup",
    gameType: "Mafia",
    total: setupConfig.total,
    roles: JSON.stringify(setupConfig.roles),
    ranked: !!ranked,
    competitive: !!competitive,
    version: 0,
    played: 0,
  });
  const setupVersion = await models.SetupVersion.create({
    version: 0,
    setup: setupDoc._id,
    changelog: "stats-test",
    played: 0,
  });
  return { setupDoc, setupVersion };
}

describe("Stats recording", function () {
  before(async function () {
    await db.promise;
  });

  beforeEach(async function () {
    await redis.client.flushdbAsync();
  });

  afterEach(async function () {
    await models.User.deleteMany({ name: /^.+$/ }).exec();
    await models.Setup.deleteMany({ name: "StatsTestSetup" }).exec();
    await models.SetupVersion.deleteMany({ changelog: "stats-test" }).exec();
  });

  describe("Player stats — completed games", function () {
    it("unranked game: records Mafia.unranked only", async function () {
      const { game } = await makeGame(mafiaSetup(), {
        preJoinHook: autoVillageWin(),
      });
      const roles = getRoles(game);
      await waitForGameEnd(game);

      for (const player of game.players) {
        const mafia = player.user.stats["Mafia"];

        mafia.unranked.totalGames.should.equal(1);
        mafia.unranked.wins.total.should.equal(1);
        mafia.unranked.abandons.total.should.equal(0);
        mafia.unranked.abandons.count.should.equal(0);

        mafia.all.totalGames.should.equal(0);
        mafia.all.wins.total.should.equal(0);
        mafia.all.wins.count.should.equal(0);
        mafia.all.abandons.total.should.equal(0);
      }

      roles["Mafioso"].user.stats["Mafia"].unranked.wins.count.should.equal(0);
      for (const v of [].concat(roles["Villager"])) {
        v.user.stats["Mafia"].unranked.wins.count.should.equal(1);
      }
    });

    it("ranked game: records Mafia.all only", async function () {
      const { game } = await makeGame(mafiaSetup(), {
        ranked: true,
        preJoinHook: autoVillageWin(),
      });
      const roles = getRoles(game);
      await waitForGameEnd(game);

      for (const player of game.players) {
        const mafia = player.user.stats["Mafia"];

        mafia.all.totalGames.should.equal(1);
        mafia.all.wins.total.should.equal(1);
        mafia.all.abandons.total.should.equal(0);

        mafia.unranked.totalGames.should.equal(0);
        mafia.unranked.wins.total.should.equal(0);
        mafia.unranked.wins.count.should.equal(0);
        mafia.unranked.abandons.total.should.equal(0);
      }

      roles["Mafioso"].user.stats["Mafia"].all.wins.count.should.equal(0);
      for (const v of [].concat(roles["Villager"])) {
        v.user.stats["Mafia"].all.wins.count.should.equal(1);
      }
    });

    it("competitive game: records Mafia.all only", async function () {
      const { game } = await makeGame(mafiaSetup(), {
        competitive: true,
        preJoinHook: autoVillageWin(),
      });
      const roles = getRoles(game);
      await waitForGameEnd(game);

      for (const player of game.players) {
        const mafia = player.user.stats["Mafia"];

        mafia.all.totalGames.should.equal(1);
        mafia.all.wins.total.should.equal(1);
        mafia.all.abandons.total.should.equal(0);

        mafia.unranked.totalGames.should.equal(0);
        mafia.unranked.wins.total.should.equal(0);
        mafia.unranked.wins.count.should.equal(0);
        mafia.unranked.abandons.total.should.equal(0);
      }

      roles["Mafioso"].user.stats["Mafia"].all.wins.count.should.equal(0);
      for (const v of [].concat(roles["Villager"])) {
        v.user.stats["Mafia"].all.wins.count.should.equal(1);
      }
    });
  });

  describe("Player stats — abandoned (vegged) games", function () {
    // Long stateLengths so the game stalls in Day 1 while we manually veg a
    // player and process the kill action deterministically.
    async function stallAndVeg(gameOpts = {}) {
      const { game } = await makeGame(mafiaSetup(), {
        ...gameOpts,
        stateLength: 60000,
      });

      const vegger = game.players.at(0);
      await game.vegPlayer(vegger);
      // vegPlayer queues a priority -999 kill action; run it now so the
      // kill fires and sets hadVegKill synchronously.
      game.processActionQueue();

      return { game, vegger };
    }

    it("unranked vegged: hadVegKill, abandon recorded in unranked only", async function () {
      const { game, vegger } = await stallAndVeg();

      game.hadVegKill.should.equal(true);
      game.ranked.should.equal(false);
      game.competitive.should.equal(false);

      vegger.user.stats["Mafia"].unranked.totalGames.should.equal(1);
      vegger.user.stats["Mafia"].unranked.abandons.total.should.equal(1);
      vegger.user.stats["Mafia"].unranked.abandons.count.should.equal(1);

      // "all" bucket never touched for an unranked game
      vegger.user.stats["Mafia"].all.totalGames.should.equal(0);
      vegger.user.stats["Mafia"].all.abandons.total.should.equal(0);
      vegger.user.stats["Mafia"].all.abandons.count.should.equal(0);

      // endPostgame gate: Mafia + hadVegKill → stats never persisted
      (game.type === "Mafia" && game.hadVegKill).should.equal(true);
    });

    it("ranked vegged: ranked flipped off; totalGames stayed in all", async function () {
      const { game, vegger } = await stallAndVeg({ ranked: true });

      game.hadVegKill.should.equal(true);
      game.ranked.should.equal(false);

      // totalGames was recorded at game start, while ranked was still true
      vegger.user.stats["Mafia"].all.totalGames.should.equal(1);
      vegger.user.stats["Mafia"].unranked.totalGames.should.equal(0);

      // abandons are recorded by Mafia.recordLeaveStats BEFORE super.vegPlayer
      // flips ranked via makeUnranked(), so the abandon lands in `all`.
      vegger.user.stats["Mafia"].all.abandons.total.should.equal(1);
      vegger.user.stats["Mafia"].all.abandons.count.should.equal(1);
      vegger.user.stats["Mafia"].unranked.abandons.total.should.equal(0);

      (game.type === "Mafia" && game.hadVegKill).should.equal(true);
    });

    it("competitive vegged: competitive flipped off; totalGames stayed in all", async function () {
      const { game, vegger } = await stallAndVeg({ competitive: true });

      game.hadVegKill.should.equal(true);
      game.competitive.should.equal(false);

      vegger.user.stats["Mafia"].all.totalGames.should.equal(1);
      vegger.user.stats["Mafia"].unranked.totalGames.should.equal(0);

      vegger.user.stats["Mafia"].all.abandons.total.should.equal(1);
      vegger.user.stats["Mafia"].all.abandons.count.should.equal(1);
      vegger.user.stats["Mafia"].unranked.abandons.total.should.equal(0);

      (game.type === "Mafia" && game.hadVegKill).should.equal(true);
    });
  });

  describe("Abandoned games — heart refund and DB non-inflation", function () {
    // These tests seed real User docs so we can observe redHearts/goldHearts
    // changes from Game.start() charging and vegPlayer → refundHeartsForIntegrityBreak.

    async function makeRankedishGameSeeded(gameOpts) {
      const setup = mafiaSetup();
      const users = makeUsers(setup.total);
      const game = new Game({
        id: shortid.generate(),
        hostId: users[0].id,
        settings: {
          setup,
          ...gameOpts,
          stateLengths: { Day: 60000, Night: 60000 },
          pregameCountdownLength: 0,
        },
        isTest: true,
      });
      await game.init();

      // Seed User docs BEFORE userJoin so start()'s heart charge actually
      // finds rows to $inc.
      for (const u of users) {
        await seedUserDoc(u, { redHearts: 3, goldHearts: 3 });
      }

      for (const u of users) await game.userJoin(u);
      await waitForRolesAssigned(game);
      return { game, users };
    }

    it("ranked vegged: non-veggers get redHearts refunded, vegger does not", async function () {
      const { game, users } = await makeRankedishGameSeeded({ ranked: true });

      game.started.should.equal(true);
      game.heartsChargedAtStart.should.equal(true);

      // start() charged 1 redHeart from every player
      for (const u of users) {
        const doc = await getUserDoc(u);
        doc.redHearts.should.equal(2);
      }

      const vegger = game.players.at(0);
      await game.vegPlayer(vegger);
      game.processActionQueue();

      game.hadVegKill.should.equal(true);
      game.ranked.should.equal(false);
      game.heartsRefundedOnIntegrityBreak.should.equal(true);

      // vegger keeps the 1-heart loss; every non-vegger is made whole
      for (const player of game.players) {
        const doc = await getUserDoc(player.user);
        if (player.id === vegger.id) {
          doc.redHearts.should.equal(2);
        } else {
          doc.redHearts.should.equal(3);
        }
      }

      // totalGames is NOT inflated in the DB — endPostgame is gated on
      // skipStatsSave, which is true for any Mafia game with hadVegKill.
      // (endPostgame never runs in isTest mode anyway; assert the gate.)
      (game.type === "Mafia" && game.hadVegKill).should.equal(true);
      for (const player of game.players) {
        const doc = await getUserDoc(player.user);
        expect(doc.stats?.Mafia).to.equal(undefined);
      }
    });

    it("competitive vegged: non-veggers get goldHearts refunded, vegger does not", async function () {
      const { game, users } = await makeRankedishGameSeeded({
        competitive: true,
      });

      game.started.should.equal(true);
      game.heartsChargedAtStart.should.equal(true);

      for (const u of users) {
        const doc = await getUserDoc(u);
        doc.goldHearts.should.equal(2);
      }

      const vegger = game.players.at(0);
      await game.vegPlayer(vegger);
      game.processActionQueue();

      game.hadVegKill.should.equal(true);
      game.competitive.should.equal(false);
      game.heartsRefundedOnIntegrityBreak.should.equal(true);

      for (const player of game.players) {
        const doc = await getUserDoc(player.user);
        if (player.id === vegger.id) {
          doc.goldHearts.should.equal(2);
        } else {
          doc.goldHearts.should.equal(3);
        }
      }

      for (const player of game.players) {
        const doc = await getUserDoc(player.user);
        expect(doc.stats?.Mafia).to.equal(undefined);
      }
    });

    it("unranked vegged: no charge and no refund", async function () {
      const { game, users } = await makeRankedishGameSeeded({});

      game.started.should.equal(true);
      game.heartsChargedAtStart.should.equal(false);

      const vegger = game.players.at(0);
      await game.vegPlayer(vegger);
      game.processActionQueue();

      game.hadVegKill.should.equal(true);

      // hearts untouched for everyone
      for (const u of users) {
        const doc = await getUserDoc(u);
        doc.redHearts.should.equal(3);
        doc.goldHearts.should.equal(3);
      }
    });
  });

  describe("Setup stats — SetupVersion writes", function () {
    // recordSetupStats writes alignmentRows/roleRows/gameLengthRows tagged
    // with "unranked" | "ranked" | "competitive", and short-circuits on
    // hadVegKill (only incrementing totalVegs). endPostgame is skipped in
    // isTest mode, so we invoke recordSetupStats directly against a seeded
    // Setup + SetupVersion.

    async function runCompletedAndRecord(gameOpts) {
      const setup = mafiaSetup({ id: `stats-${shortid.generate()}` });
      await seedSetupAndVersion(setup, gameOpts);
      const { game } = await makeGame(setup, {
        ...gameOpts,
        preJoinHook: autoVillageWin(),
      });
      await waitForGameEnd(game);
      const setupDoc = await models.Setup.findOne({ id: setup.id });
      await game.recordSetupStats(setupDoc);
      return { game, setup, setupDoc };
    }

    async function fetchSv(setupDoc) {
      return models.SetupVersion.findOne({ setup: setupDoc._id }).lean();
    }

    it("unranked completed: alignment/role rows tagged 'unranked'", async function () {
      const { setupDoc } = await runCompletedAndRecord({});
      const sv = await fetchSv(setupDoc);

      sv.played.should.equal(1);
      sv.setupStats.totalVegs.should.equal(0);
      sv.setupStats.alignmentRows.length.should.be.greaterThan(0);
      for (const row of sv.setupStats.alignmentRows) {
        row[1].should.equal("unranked");
      }
      for (const row of sv.setupStats.roleRows) {
        row[1].should.equal("unranked");
      }
      for (const row of sv.setupStats.gameLengthRows) {
        row[0].should.equal("unranked");
      }
    });

    it("ranked completed: alignment/role rows tagged 'ranked'", async function () {
      const { setupDoc } = await runCompletedAndRecord({ ranked: true });
      const sv = await fetchSv(setupDoc);

      sv.played.should.equal(1);
      sv.setupStats.totalVegs.should.equal(0);
      sv.setupStats.alignmentRows.length.should.be.greaterThan(0);
      for (const row of sv.setupStats.alignmentRows) {
        row[1].should.equal("ranked");
      }
      for (const row of sv.setupStats.roleRows) {
        row[1].should.equal("ranked");
      }
      for (const row of sv.setupStats.gameLengthRows) {
        row[0].should.equal("ranked");
      }
    });

    it("competitive completed: alignment/role rows tagged 'competitive'", async function () {
      const { setupDoc } = await runCompletedAndRecord({ competitive: true });
      const sv = await fetchSv(setupDoc);

      sv.played.should.equal(1);
      sv.setupStats.totalVegs.should.equal(0);
      sv.setupStats.alignmentRows.length.should.be.greaterThan(0);
      for (const row of sv.setupStats.alignmentRows) {
        row[1].should.equal("competitive");
      }
      for (const row of sv.setupStats.roleRows) {
        row[1].should.equal("competitive");
      }
      for (const row of sv.setupStats.gameLengthRows) {
        row[0].should.equal("competitive");
      }
    });

    it("conversion: villager converted to Mafia, Mafia wins → Village win rate is 0%", async function () {
      // 3 Villager + 1 Yakuza. Yakuza converts a Villager to Mafioso, then
      // Mafia wins (Yakuza + converted Villager). The pre-fix behaviour
      // bucketed every player by their starting role, so this game would
      // record [Village, true] in alignmentRows — a Village "win" the
      // Village never actually earned. After the fix, final roles are used
      // and Village registers as [Village, false] (0%) while Mafia is true.
      const setupConfig = {
        id: `stats-${shortid.generate()}`,
        total: 4,
        roles: [{ Villager: 3, Yakuza: 1 }],
      };
      await seedSetupAndVersion(setupConfig);

      const { game } = await makeGame(setupConfig, { stateLength: 60000 });

      const yakuza = game.players.filter((p) => p.role.name === "Yakuza")[0];
      const villagers = game.players.filter((p) => p.role.name === "Villager");
      yakuza.should.exist;
      villagers.length.should.equal(3);

      // Yakuza converts the first villager to Mafioso (the actual Yakuza
      // mechanic also kills the Yakuza via seppuku — we don't need to
      // simulate the kill since dead players still count as winners).
      const convertedVillager = villagers[0];
      convertedVillager.setRole("Mafioso", null, true, true, true, "Mafia");
      convertedVillager.role.name.should.equal("Mafioso");
      convertedVillager.role.alignment.should.equal("Mafia");

      // Mafia wins: the Yakuza and the converted Mafioso. recordSetupStats
      // is normally called by endPostgame after this.winners is populated;
      // build the same shape directly.
      const winners = new MafiaWinners(game);
      winners.addPlayer(yakuza, "Mafia");
      winners.addPlayer(convertedVillager, "Mafia");
      winners.determinePlayers();
      game.winners = winners;

      const setupDoc = await models.Setup.findOne({ id: setupConfig.id });
      await game.recordSetupStats(setupDoc);

      const sv = await fetchSv(setupDoc);

      // Two Village starters remain Village at game end (the third one was
      // converted), so alignmentRows for Village must be tagged false.
      const villageRows = sv.setupStats.alignmentRows.filter(
        (r) => r[0] === "Village"
      );
      const mafiaRows = sv.setupStats.alignmentRows.filter(
        (r) => r[0] === "Mafia"
      );
      villageRows.length.should.equal(1);
      villageRows[0][2].should.equal(false);
      mafiaRows.length.should.equal(1);
      mafiaRows[0][2].should.equal(true);

      // Aggregate maps reflect final roles too. Mongoose Map fields come
      // back as plain objects via .lean().
      const plays = sv.alignmentPlays || {};
      const wins = sv.alignmentWins || {};
      plays.Village.should.equal(2);
      plays.Mafia.should.equal(2);
      expect(wins.Village).to.equal(undefined);
      wins.Mafia.should.equal(2);
    });

    it("vegged game: totalVegs incremented; played/alignmentRows NOT touched", async function () {
      const setup = mafiaSetup({ id: `stats-${shortid.generate()}` });
      await seedSetupAndVersion(setup, { ranked: true });

      const { game } = await makeGame(setup, {
        ranked: true,
        stateLength: 60000,
      });

      const vegger = game.players.at(0);
      await game.vegPlayer(vegger);
      game.processActionQueue();
      game.hadVegKill.should.equal(true);

      const setupDoc = await models.Setup.findOne({ id: setup.id });
      await game.recordSetupStats(setupDoc);

      const sv = await fetchSv(setupDoc);
      sv.setupStats.totalVegs.should.equal(1);
      sv.played.should.equal(0);
      sv.setupStats.alignmentRows.length.should.equal(0);
      sv.setupStats.roleRows.length.should.equal(0);
      sv.setupStats.gameLengthRows.length.should.equal(0);
    });
  });
});
