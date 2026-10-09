const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const db = require("../../db/db");
const redis = require("../../modules/redis");
const shortid = require("shortid");
const Game = require("../../Games/core/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const models = require("../../db/models");

let seq = 0;
const createdUserIds = [];

function nextId(prefix) {
  seq += 1;
  return `${prefix}${seq}`;
}

function makeUser(id, name) {
  return new User({
    id: id || nextId("u"),
    socket: new Socket(),
    name: name || id || "user",
    settings: {},
  });
}

function events(socket, name) {
  return socket.clientMessages.filter((message) => message.eventName === name);
}

async function makeGame(extra) {
  extra = extra || {};
  const game = new Game({
    id: extra.id || nextId("g"),
    hostId: extra.hostId || nextId("h"),
    settings: {
      setup: { id: "setup", total: extra.total || 3 },
      private: true,
      ranked: !!extra.ranked,
      competitive: !!extra.competitive,
      spectating: extra.spectating !== false,
      readyCheck: extra.readyCheck !== false,
      stateLengths: { Day: 1000, Night: 1000 },
    },
    isTest: true,
  });
  await game.init();
  // isTest would start immediately when the seats fill, skipping the ready check.
  game.checkGameStart = () => {};
  return game;
}

async function seedUser(user, hearts) {
  hearts = hearts || {};
  createdUserIds.push(user.id);
  return models.User.create({
    id: user.id,
    name: user.name,
    deleted: false,
    redHearts: hearts.redHearts != null ? hearts.redHearts : 3,
    goldHearts: hearts.goldHearts != null ? hearts.goldHearts : 3,
    stats: {},
  });
}

describe("Games/SpectateJoin", function () {
  this.timeout(20000);

  before(async function () {
    await db.promise;
  });

  after(async function () {
    await models.User.deleteMany({ id: { $in: createdUserIds } });
    await models.Ban.deleteMany({ userId: { $in: createdUserIds } });
    await models.LeavePenalty.deleteMany({ userId: { $in: createdUserIds } });
  });

  afterEach(async function () {
    if (this.currentGame) {
      this.currentGame.clearTimers();
      await this.currentGame.cancel();
      this.currentGame = null;
    }
  });

  async function openGame(extra) {
    await redis.client.flushdbAsync();
    const game = await makeGame(extra);
    this.currentGame = game;
    return game;
  }

  it("spectate intent does not take a seat and can speak in pregame", async function () {
    const game = await openGame.call(this, { total: 3 });
    const player = makeUser(game.hostId, "host");
    const spectatorUser = makeUser(null, "spec");

    await game.userJoin(player);
    await game.userJoin(spectatorUser, { spectate: true });

    game.players.should.have.lengthOf(1);
    game.spectators.should.have.lengthOf(1);
    game.alivePlayers().should.have.lengthOf(1);

    const spectator = game.spectators[0];
    spectator.user.id.should.equal(spectatorUser.id);
    should.exist(game.pregame.members[spectator.id]);
    game.pregame.members[spectator.id].canTalk.should.equal(true);
    expect(await redis.inGame(spectatorUser.id)).to.equal(false);
    (await redis.inGame(player.id)).should.equal(game.id);

    player.socket.flushMessages();
    spectatorUser.socket.flushMessages();
    spectator.socket.sendToServer("speak", {
      content: "hello from spec",
      meetingId: String(game.pregame.id),
      abilityName: "",
      abilityTarget: "",
    });

    const heardByPlayer = events(player.socket, "message");
    const heardBySpec = events(spectatorUser.socket, "message");
    heardByPlayer.should.have.lengthOf(1);
    heardByPlayer[0].data.content.should.equal("hello from spec");
    heardBySpec.should.have.lengthOf(1);
    heardBySpec[0].data.content.should.equal("hello from spec");
  });

  it("does not treat spectate string false as spectate intent", async function () {
    const game = await openGame.call(this);
    const user = makeUser(game.hostId, "host");

    await game.userJoin(user, { spectate: "false" });

    game.players.should.have.lengthOf(1);
    game.spectators.should.have.lengthOf(0);
    (await redis.inGame(user.id)).should.equal(game.id);
  });

  it("refuses the next spectator when the limit is full", async function () {
    const game = await openGame.call(this);
    game.spectatorLimit = 1;
    const first = makeUser(null, "first");
    const second = makeUser(null, "second");

    await game.userJoin(first, { spectate: true });
    await game.userJoin(second, { spectate: true });

    game.spectators.should.have.lengthOf(1);
    game.players.should.have.lengthOf(0);
    events(second.socket, "error")
      .map((message) => message.data)
      .should.include("Spectator limit reached");
    expect(await redis.inGame(second.id)).to.equal(false);
  });

  it("refuses spectating when the lobby has it turned off", async function () {
    const game = await openGame.call(this, { spectating: false });
    const user = makeUser(null, "watcher");

    await game.userJoin(user, { spectate: true });

    game.spectators.should.have.lengthOf(0);
    game.players.should.have.lengthOf(0);
    events(user.socket, "error")
      .map((message) => message.data)
      .should.include("Spectating is not enabled for this game");
  });

  it("keeps a seated player seated when spectating is off", async function () {
    const game = await openGame.call(this, { spectating: false });
    const seated = makeUser(game.hostId, "host");
    await game.userJoin(seated);

    const again = makeUser(game.hostId, "host");
    await game.userJoin(again, { spectate: true });

    game.players.should.have.lengthOf(1);
    game.spectators.should.have.lengthOf(0);
    (await redis.inGame(game.hostId)).should.equal(game.id);
    events(again.socket, "spectateFailed")
      .map((message) => message.data)
      .should.include("Spectating is not enabled for this game");
    events(again.socket, "error").should.have.lengthOf(0);
  });

  it("clears the host redis seat when the host joins as a spectator", async function () {
    const game = await openGame.call(this);
    (await redis.inGame(game.hostId)).should.equal(game.id);

    const host = makeUser(game.hostId, "host");
    await game.userJoin(host, { spectate: true });

    game.players.should.have.lengthOf(0);
    game.spectators.should.have.lengthOf(1);
    expect(await redis.inGame(game.hostId)).to.equal(false);
  });

  it("takeSeat uses the normal join path", async function () {
    const game = await openGame.call(this, { total: 2 });
    const spectatorUser = makeUser(null, "spec");
    await game.userJoin(spectatorUser, { spectate: true });
    const spectator = game.spectators[0];
    let markDone;
    const seated = new Promise((resolve) => {
      markDone = resolve;
    });
    const originalTakeSeat = game.takeSeat.bind(game);
    game.takeSeat = function (person) {
      return Promise.resolve(originalTakeSeat(person)).then(
        (result) => {
          markDone();
          return result;
        },
        (error) => {
          markDone();
          throw error;
        }
      );
    };

    spectator.socket.sendToServer("takeSeat");
    await seated;

    game.players.should.have.lengthOf(1);
    game.spectators.should.have.lengthOf(0);
    expect(game.pregameSpectatorUserIds.has(spectatorUser.id)).to.equal(false);
    (await redis.inGame(spectatorUser.id)).should.equal(game.id);
    should.exist(game.pregame.members[game.players.array()[0].id]);

    const spectatorFlags = events(spectatorUser.socket, "isSpectator");
    expect(spectatorFlags[spectatorFlags.length - 1].data).to.equal(false);
  });

  it("takeSeat refuses a banned spectator and leaves them spectating", async function () {
    const game = await openGame.call(this);
    const user = makeUser(null, "banned");
    await game.userJoin(user, { spectate: true });
    game.banned[user.id] = true;

    await game.takeSeat(game.spectators[0]);

    game.players.should.have.lengthOf(0);
    game.spectators.should.have.lengthOf(1);
    expect(await redis.inGame(user.id)).to.equal(false);
    events(user.socket, "takeSeatFailed")
      .map((message) => message.data)
      .should.include("You are banned from this game.");
  });

  it("takeSeat refuses ranked and competitive players without permission", async function () {
    const ranked = await openGame.call(this, { ranked: true, total: 2 });
    const rankedUser = makeUser(null, "ranked");
    await seedUser(rankedUser, { redHearts: 3, goldHearts: 3 });
    await models.Ban.create({
      id: shortid.generate(),
      userId: rankedUser.id,
      modId: null,
      expires: 0,
      permissions: ["playRanked"],
      type: "site",
      auto: false,
    });
    await gameJoinSpectate(ranked, rankedUser);

    await ranked.takeSeat(ranked.spectators[0]);

    ranked.players.should.have.lengthOf(0);
    ranked.spectators.should.have.lengthOf(1);
    events(rankedUser.socket, "takeSeatFailed")
      .map((message) => message.data)
      .should.include(
        "You are unable to play ranked games. Please contact an admin if this is in error."
      );

    ranked.clearTimers();
    await ranked.cancel();
    this.currentGame = null;

    const competitive = await openGame.call(this, {
      competitive: true,
      total: 2,
    });
    const compUser = makeUser(null, "comp");
    await seedUser(compUser, { redHearts: 3, goldHearts: 3 });
    await models.Ban.create({
      id: shortid.generate(),
      userId: compUser.id,
      modId: null,
      expires: 0,
      permissions: ["playCompetitive"],
      type: "site",
      auto: false,
    });
    await gameJoinSpectate(competitive, compUser);

    await competitive.takeSeat(competitive.spectators[0]);

    competitive.players.should.have.lengthOf(0);
    events(compUser.socket, "takeSeatFailed")
      .map((message) => message.data)
      .should.include(
        "You are unable to play competitive games. Please contact an admin if this is in error."
      );
  });

  it("takeSeat refuses depleted hearts, a leave penalty, and a full lobby", async function () {
    const ranked = await openGame.call(this, { ranked: true, total: 2 });
    const tired = makeUser(null, "tired");
    await seedUser(tired, { redHearts: 0, goldHearts: 3 });
    await gameJoinSpectate(ranked, tired);

    await ranked.takeSeat(ranked.spectators[0]);

    ranked.players.should.have.lengthOf(0);
    events(tired.socket, "takeSeatFailed")
      .map((message) => message.data)
      .should.include(
        "You cannot play ranked games because your Red Hearts are depleted."
      );
    const tiredDoc = await models.User.findOne({ id: tired.id }).lean();
    tiredDoc.redHearts.should.equal(0);

    ranked.clearTimers();
    await ranked.cancel();
    this.currentGame = null;

    const penalizedGame = await openGame.call(this, { total: 2 });
    const penalized = makeUser(null, "penalized");
    await seedUser(penalized);
    await models.LeavePenalty.create({
      userId: penalized.id,
      canPlayAfter: Date.now() + 10 * 60000,
      level: 1,
    });
    await gameJoinSpectate(penalizedGame, penalized);

    await penalizedGame.takeSeat(penalizedGame.spectators[0]);

    penalizedGame.players.should.have.lengthOf(0);
    events(penalized.socket, "takeSeatFailed")[0].data.should.match(
      /unable to play games/
    );

    penalizedGame.clearTimers();
    await penalizedGame.cancel();
    this.currentGame = null;

    const full = await openGame.call(this, { total: 1 });
    const host = makeUser(full.hostId, "host");
    const watcher = makeUser(null, "watcher");
    await full.userJoin(host);
    await full.userJoin(watcher, { spectate: true });

    await full.takeSeat(full.spectators[0]);

    full.players.should.have.lengthOf(1);
    full.spectators.should.have.lengthOf(1);
    events(watcher.socket, "takeSeatFailed")
      .map((message) => message.data)
      .should.include("No open seats.");
    expect(await redis.inGame(watcher.id)).to.equal(false);
  });

  it("moves unready players to spectators without charging hearts", async function () {
    async function run(ranked) {
      const game = await openGame.call(this, { ranked: ranked, total: 2 });
      const readyUser = makeUser(game.hostId, "ready");
      const lateUser = makeUser(null, "late");
      await seedUser(readyUser, { redHearts: 3 });
      await seedUser(lateUser, { redHearts: 3 });
      await game.userJoin(readyUser);
      await game.userJoin(lateUser);

      const beforeReady = await models.User.findOne({
        id: readyUser.id,
      }).lean();
      const beforeLate = await models.User.findOne({ id: lateUser.id }).lean();

      game.startReadyCheck();
      const readyPlayer = game.players.array().filter((player) => {
        return player.user.id === readyUser.id;
      })[0];
      game.playerReady(readyPlayer);

      readyUser.socket.flushMessages();
      lateUser.socket.flushMessages();
      await game.failReadyCheck();

      game.players.should.have.lengthOf(1);
      game.players.array()[0].user.id.should.equal(readyUser.id);
      game.spectators.should.have.lengthOf(1);
      game.spectators[0].user.id.should.equal(lateUser.id);
      should.exist(game.pregame.members[game.spectators[0].id]);
      expect(await redis.inGame(lateUser.id)).to.equal(false);
      (await redis.inGame(readyUser.id)).should.equal(game.id);

      events(lateUser.socket, "readyCheck failed").should.have.lengthOf(1);
      events(lateUser.socket, "readyCheck cancel").should.have.lengthOf(0);
      events(readyUser.socket, "readyCheck cancel").should.have.lengthOf(1);
      events(readyUser.socket, "readyCheck failed").should.have.lengthOf(0);

      const afterReady = await models.User.findOne({ id: readyUser.id }).lean();
      const afterLate = await models.User.findOne({ id: lateUser.id }).lean();
      afterReady.redHearts.should.equal(beforeReady.redHearts);
      afterLate.redHearts.should.equal(beforeLate.redHearts);
      const penalties = await models.LeavePenalty.find({
        userId: { $in: [readyUser.id, lateUser.id] },
      });
      penalties.should.have.lengthOf(0);

      game.clearTimers();
      await game.cancel();
      this.currentGame = null;
    }

    await run.call(this, false);
    await run.call(this, true);
  });

  it("remembers a pregame spectator across refresh", async function () {
    const game = await openGame.call(this, { total: 2 });
    const user = makeUser(null, "refresh");
    await game.userJoin(user, { spectate: true });

    game.spectators[0].socket.sendToServer("disconnected");

    game.spectators.should.have.lengthOf(0);
    expect(game.pregameSpectatorUserIds.has(user.id)).to.equal(true);

    const returned = makeUser(user.id, "refresh");
    await game.userJoin(returned);

    game.players.should.have.lengthOf(0);
    game.spectators.should.have.lengthOf(1);
    expect(await redis.inGame(user.id)).to.equal(false);
  });

  it("does not count spectators toward start or veg", async function () {
    const game = await openGame.call(this, { total: 2, spectating: true });
    const seen = [];
    game.checkGameStart = function () {
      seen.push(this.players.length);
    };

    const player = makeUser(game.hostId, "host");
    const spectatorUser = makeUser(null, "spec");
    await game.userJoin(player);
    await game.userJoin(spectatorUser, { spectate: true });

    seen.should.eql([1]);
    game.players.should.have.lengthOf(1);
    game.alivePlayers().should.have.lengthOf(1);
    expect(game.started).to.not.equal(true);

    const spectator = game.spectators[0];
    // An empty veg vote is immediately ready and would advance the state.
    game.gotoNextState = () => {};
    game.checkVeg();
    should.not.exist(game.vegKickMeeting.members[spectator.id]);
    should.exist(game.vegKickMeeting.members[game.players.array()[0].id]);
    game.clearTimer("vegKickCountdown");

    game.assignRoles = () => {};
    game.captureStartingFactions = () => {};
    game.gotoNextState = () => {};
    await game.start();

    game.players.should.have.lengthOf(1);
    game.alivePlayers().should.have.lengthOf(1);
    should.not.exist(game.pregame.members[spectator.id]);

    game.makeMeetings();
    should.exist(game.spectatorMeeting.members[spectator.id]);
    should.not.exist(game.pregame.members[spectator.id]);
  });
});

async function gameJoinSpectate(game, user) {
  await game.userJoin(user, { spectate: true });
}
