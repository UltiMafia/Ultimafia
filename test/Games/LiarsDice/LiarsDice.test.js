const chai = require("chai"),
  should = chai.should();
const db = require("../../../db/db");
const redis = require("../../../modules/redis");
const LiarsDiceGame = require("../../../Games/types/LiarsDice/Game");
const { makeGame, waitFor, meetingOf, seedChat } = require("../../../scripts/gameSim/harness");
const bot = require("../../../scripts/gameSim/liarsDiceBot");

async function startGame(options = {}) {
  const players = options.players || 4;
  const made = await makeGame(LiarsDiceGame, {
    players,
    setup: { total: players, roles: [{ "Liar:": players }] },
    settings: {
      stateLengths: { "Guess Dice": options.length || 60000 },
      startingDice: options.startingDice || 3,
      wildOnes: options.wildOnes ?? false,
      spotOn: options.spotOn ?? true,
    },
  });
  await waitFor(() => made.game.started && made.game.getStateName() == "Guess Dice");
  return made;
}

function rig(game, dice) {
  game.allRolledDice = [];
  game.allDice = 0;
  game.randomizedPlayersCopy.forEach((player, i) => {
    player.rolledDice = (dice[i] || []).slice(0, player.diceNum);
    game.allRolledDice.push(...player.rolledDice);
    game.allDice += player.rolledDice.length;
  });
}

function seat(game, offset = 0) {
  return game.randomizedPlayersCopy[(game.currentIndex + offset) % game.randomizedPlayersCopy.length];
}

function alertsSince(game, from) {
  return game.history.states[game.currentState].alerts.slice(from).map((m) => m.content);
}

function casino(game) {
  return game.history.getMeetings().find((m) => m.name == "Casino");
}

const tick = () => new Promise((r) => setTimeout(r, 20));

async function bid(game, amount, face) {
  bot.act(game, { amount, face });
  await tick();
}

async function call(game, name) {
  bot.act(game, { call: name });
  await tick();
}

describe("Games/LiarsDice engine", function () {
  this.timeout(30000);

  before(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
  });

  it("passes the turn on a bid without a state change and keeps the chat meeting", async function () {
    const { game } = await startGame();
    const state = game.currentState;
    const chat = casino(game).id;
    const first = seat(game);
    const alerts = game.history.states[state].alerts.length;

    await bid(game, 2, 5);

    game.currentState.should.equal(state);
    casino(game).id.should.equal(chat);
    seat(game).should.not.equal(first);
    bot.holder(game).should.equal(seat(game));
    alertsSince(game, alerts).should.deep.equal([`${first.name} bids 2x :dice5:`]);
    game.roundBids.should.deep.equal([{ bidder: first.name, amount: 2, face: 5 }]);
    game.getStateInfo().extraInfo.bidInfo.roundBids.should.have.lengthOf(1);
    game.history.states[state].extraInfo.bidInfo.lastAmountBid.should.equal("2");
  });

  it("rejects a bid that does not raise and keeps the turn", async function () {
    const { game } = await startGame();
    await bid(game, 3, 4);
    const current = seat(game);
    const alerts = game.history.states[game.currentState].alerts.length;

    await bid(game, 3, 2);
    await bid(game, 2, 6);

    seat(game).should.equal(current);
    bot.holder(game).should.equal(current);
    game.roundBids.should.have.lengthOf(1);
    alertsSince(game, alerts).should.have.lengthOf(0);
  });

  it("charges the caller when a called bid was true, then starts a new round with a fresh bet log", async function () {
    const { game } = await startGame();
    rig(game, [[5, 5, 1], [5, 2, 3], [4, 4, 4], [6, 6, 2]]);
    const bidder = seat(game);
    await bid(game, 3, 5);
    const caller = seat(game);
    const state = game.currentState;

    await call(game, "CallLie");

    caller.diceNum.should.equal(2);
    bidder.diceNum.should.equal(3);
    game.currentState.should.equal(state + 1);
    game.roundBids.should.deep.equal([]);
    game.getStateInfo().extraInfo.bidInfo.roundBids.should.deep.equal([]);
    game.history.states[state].extraInfo.bidInfo.roundBids.should.have.lengthOf(1);
  });

  it("charges the bidder when a called bid was a lie", async function () {
    const { game } = await startGame();
    rig(game, [[5, 1, 1], [2, 2, 3], [4, 4, 4], [6, 6, 2]]);
    const bidder = seat(game);
    await bid(game, 2, 5);
    const caller = seat(game);

    await call(game, "CallLie");

    bidder.diceNum.should.equal(2);
    caller.diceNum.should.equal(3);
  });

  it("counts ones as wild unless ones were bid", async function () {
    const { game } = await startGame({ wildOnes: true });
    rig(game, [[5, 1, 1], [2, 2, 3], [4, 4, 4], [6, 6, 2]]);
    const bidder = seat(game);
    await bid(game, 3, 5);
    const caller = seat(game);

    await call(game, "CallLie");

    caller.diceNum.should.equal(2);
    bidder.diceNum.should.equal(3);
  });

  it("spot on that is exact costs everyone else a die", async function () {
    const { game } = await startGame();
    rig(game, [[5, 5, 1], [5, 2, 3], [4, 4, 4], [6, 6, 2]]);
    await bid(game, 3, 5);
    const caller = seat(game);

    await call(game, "SpotOn");

    for (const p of game.randomizedPlayersCopy)
      p.diceNum.should.equal(p == caller ? 3 : 2);
  });

  it("spot on that is not exact costs the caller a die", async function () {
    const { game } = await startGame();
    rig(game, [[5, 5, 1], [5, 2, 3], [4, 4, 4], [6, 6, 2]]);
    await bid(game, 2, 5);
    const caller = seat(game);

    await call(game, "SpotOn");

    for (const p of game.randomizedPlayersCopy)
      p.diceNum.should.equal(p == caller ? 2 : 3);
  });

  it("spot on before any bid costs nothing and keeps the turn", async function () {
    const { game } = await startGame();
    const state = game.currentState;
    const caller = seat(game);

    await call(game, "SpotOn");

    game.currentState.should.equal(state);
    bot.holder(game).should.equal(caller);
    for (const p of game.randomizedPlayersCopy) p.diceNum.should.equal(3);
  });

  it("sends the same small update per bid no matter how long the chat is", async function () {
    const perBid = {};
    for (const n of [50, 500]) {
      const { game, meter } = await startGame();
      seedChat(game, "Casino", n);
      meter.reset();
      for (let i = 1; i <= 4; i++) await bid(game, i, 6);
      perBid[n] = meter.snapshot();
      should.not.exist(perBid[n].byEvent.history);
    }
    perBid[500].frames.should.equal(perBid[50].frames);
    Math.abs(perBid[500].bytes - perBid[50].bytes).should.be.below(400);
  });

  it("never sends a player anyone else's unrevealed dice", async function () {
    const { game, users } = await startGame({ players: 5 });
    const frames = new Map();
    for (const user of users) {
      const list = [];
      frames.set(user, list);
      const inner = user.socket.send;
      user.socket.send = (e, d) => {
        list.push([e, JSON.parse(JSON.stringify(d ?? null))]);
        return inner(e, d);
      };
    }
    const reconnecting = game.players.array()[2];
    game.sendAllGameInfo(reconnecting);
    for (let i = 0; i < 6 && !game.finished; i++) {
      bot.act(game);
      await tick();
    }

    let checked = 0;
    const leaks = [];
    function scan(node, viewerId) {
      if (!node || typeof node != "object") return;
      if (Array.isArray(node)) return node.forEach((n) => scan(n, viewerId));
      if (node.playerId && Array.isArray(node.rolledDice)) {
        checked += 1;
        if (node.playerId != viewerId && node.rolledDice.some((d) => d != 0))
          leaks.push({ viewerId, owner: node.playerId });
      }
      for (const key in node) scan(node[key], viewerId);
    }
    for (const [user, list] of frames) {
      const viewer = game.players.array().find((p) => p.user == user);
      scan(list, viewer.id);
      for (const state of Object.values(viewer.history.getHistoryInfo()))
        scan(state.extraInfo, viewer.id);
    }
    for (const state of Object.values(game.spectatorHistory.getHistoryInfo()))
      scan(state.extraInfo, null);

    checked.should.be.above(20);
    leaks.should.deep.equal([]);
  });

  it("sends each player's dice color to everyone but only the owner's values", async function () {
    const { game } = await startGame();
    const owner = game.randomizedPlayersCopy[0];
    const viewer = game.randomizedPlayersCopy[1];
    owner.user.diceColor = "#aa2233";
    rig(game, [[2, 3, 4], [5, 5, 5], [1, 1, 1], [6, 6, 6]]);
    const info = game.getStateInfo().extraInfo;
    const seen = game.extraInfoFor(info, viewer).randomizedPlayers.find((p) => p.playerId == owner.id);
    seen.diceColor.should.equal("#aa2233");
    seen.rolledDice.should.deep.equal([0, 0, 0]);
    const own = game.extraInfoFor(info, owner).randomizedPlayers.find((p) => p.playerId == owner.id);
    own.rolledDice.should.deep.equal([2, 3, 4]);
    own.diceColor.should.equal("#aa2233");
  });

  it("ignores a dice color the user has not bought", function () {
    const User = require("../../../Games/core/User");
    const settings = { diceColor: "#123456" };
    should.not.exist(new User({ id: "a", settings, itemsOwned: {} }).diceColor);
    should.not.exist(new User({ id: "b", settings, itemsOwned: { diceColor: 0 } }).diceColor);
    new User({ id: "c", settings, itemsOwned: { diceColor: 1 } }).diceColor.should.equal("#123456");
  });

  it("reveals the called round's dice as previous rolls", async function () {
    const { game } = await startGame();
    const dice = [[5, 5, 1], [5, 2, 3], [4, 4, 4], [6, 6, 2]];
    rig(game, dice);
    await bid(game, 9, 6);
    const caller = seat(game);
    const observer = game.players.array().find((p) => p != caller);
    const inner = observer.user.socket.send;
    let state;
    observer.user.socket.send = (e, d) => {
      if (e == "state") state = JSON.parse(JSON.stringify(d));
      return inner(e, d);
    };

    await call(game, "CallLie");

    const revealed = Object.fromEntries(
      state.extraInfo.randomizedPlayers.map((p) => [p.playerId, p.previousRolls])
    );
    game.randomizedPlayersCopy.forEach((p, i) => {
      const expected = p == game.lastBidder || p.diceNum < 3 ? null : dice[i];
      if (expected) revealed[p.id].should.deep.equal(expected);
      revealed[p.id].length.should.be.at.least(2);
    });
  });

  it("plays a full bot game to a single winner", async function () {
    const { game } = await startGame({ players: 5, startingDice: 2, wildOnes: true });
    let moves = 0;
    while (!game.finished && moves < 400) {
      bot.act(game);
      moves += 1;
      await new Promise((r) => setTimeout(r, 2));
    }
    game.finished.should.be.true;
    game.alivePlayers().length.should.be.at.most(1);
    moves.should.be.above(5);
  });
});
