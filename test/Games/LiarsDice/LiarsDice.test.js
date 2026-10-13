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
