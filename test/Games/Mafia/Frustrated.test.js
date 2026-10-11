const dotenv = require("dotenv").config();
const chai = require("chai");
const expect = chai.expect;
chai.should();
const db = require("../../../db/db");
const redis = require("../../../modules/redis");
const shortid = require("shortid");
const Game = require("../../../Games/types/Mafia/Game");
const User = require("../../../Games/core/User");
const Socket = require("../../../lib/sockets").TestSocket;
const modifiers = require("../../../data/modifiers");

function makeUser() {
  return new User({
    id: shortid.generate(),
    socket: new Socket(),
    name: shortid.generate(),
    settings: {},
    isTest: true,
  });
}

function setupFrom(roleNames) {
  const counts = {};
  for (let roleName of roleNames) {
    counts[roleName] = (counts[roleName] || 0) + 1;
  }
  return {
    total: roleNames.length,
    roles: [counts],
    gameSettings: { "Day Start": true },
  };
}

async function makeGame(roleNames) {
  const setup = setupFrom(roleNames);
  const users = roleNames.map(() => makeUser());
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setup,
      stateLengths: { Day: 60000, Night: 60000 },
      pregameCountdownLength: 0,
    },
    isTest: true,
  });

  await game.init();
  for (let user of users) await game.userJoin(user);
  return game;
}

function takePlayers(game, spec) {
  const pool = {};
  for (let player of game.players) {
    const key = `${player.role.name}:${player.role.modifier || ""}`;
    if (!pool[key]) pool[key] = [];
    pool[key].push(player);
  }

  const out = {};
  for (let item of spec) {
    const key = `${item.role}:${item.modifier || ""}`;
    const list = pool[key];
    if (!list || list.length === 0) {
      throw new Error(`missing ${item.key} (${key})`);
    }
    out[item.key] = list.shift();
  }
  return out;
}

function play(game, ballots) {
  expect(game.finished, "game ended before the village vote").to.equal(false);
  const meeting = game.getMeetingByName("Village");
  expect(meeting, `no Village meeting in ${game.getStateName()}`).to.exist;

  for (let ballot of ballots) {
    meeting.vote(ballot.voter, ballot.selection);
    expect(
      meeting.votes[ballot.voter.id],
      `${ballot.voter.role.name} vote was not recorded`
    ).to.equal(ballot.selection);
  }

  expect(
    meeting.finished,
    `meeting open, votes=${JSON.stringify(meeting.votes)}`
  ).to.equal(true);
  return meeting;
}

function aliveMap(players) {
  const map = {};
  for (let key in players) map[key] = players[key].alive;
  return map;
}

function expectAlive(players, flags) {
  for (let key in flags) {
    expect(
      players[key].alive,
      `${key} alive map ${JSON.stringify(aliveMap(players))}`
    ).to.equal(flags[key]);
  }
}

function gameHasAlert(game, alertMsg) {
  return Object.values(game.history.states)
    .flatMap((state) => state.alerts || [])
    .some((alert) => alert.content && alert.content.includes(alertMsg));
}

function actionCount(game) {
  if (!game.actions[0]) return 0;
  return [...game.actions[0]].length;
}

describe("Games/Mafia/Frustrated", function () {
  this.timeout(30000);

  beforeEach(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
  });

  afterEach(function () {
    if (this.game) this.game.clearTimers();
  });

  it("1. F=2 vs A=1: F is not lowest and survives", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "V", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    // Two votes on F, one on A. F is the plurality, not the lowest.
    play(game, [
      { voter: p.V, selection: p.F.id },
      { voter: p.F, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.M, selection: "*" },
    ]);

    expectAlive(p, { F: true, A: true });
    gameHasAlert(game, "feels immensely frustrated").should.equal(false);
  });

  it("2. King votes A, one vote on F: F dies and A is not condemned", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "King",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "K", role: "King" },
      { key: "A", role: "Mafioso" },
    ]);
    p.K.role.VotePower.should.equal(10000);

    // Weighted F=1, A=10000. Raw ballots are F=1, A=1, no-one=1,
    // so the old min===max check lets F live.
    play(game, [
      { voter: p.K, selection: p.A.id },
      { voter: p.A, selection: p.F.id },
      { voter: p.F, selection: "*" },
    ]);

    expectAlive(p, { F: false, A: true });
    gameHasAlert(
      game,
      `${p.F.name} feels immensely frustrated`
    ).should.equal(true);
  });

  it("3. two Kings vote F while F votes A: F survives", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "King",
      "King",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "K1", role: "King" },
      { key: "K2", role: "King" },
      { key: "A", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    // Admiral also has VoteWeightMax, but ReplaceAlways converts the town.
    // A second King is the other 10000-weight vote. F=20000, A=1.
    play(game, [
      { voter: p.K1, selection: p.F.id },
      { voter: p.K2, selection: p.F.id },
      { voter: p.F, selection: p.A.id },
      { voter: p.A, selection: "*" },
      { voter: p.M, selection: "*" },
    ]);

    expectAlive(p, { F: true, A: true });
    gameHasAlert(game, "feels immensely frustrated").should.equal(false);
  });

  it("4. Frustrated King with 1 vote against 3 dies", async function () {
    const game = await makeGame([
      "King:Frustrated",
      "Villager",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "King", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "V", role: "Villager" },
      { key: "W", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);
    p.F.hasEffect("Frustrated").should.equal(true);
    p.F.role.VotePower.should.equal(10000);

    // King votes no one, so the 10000 weight is not added to A.
    play(game, [
      { voter: p.V, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.W, selection: p.A.id },
      { voter: p.M, selection: p.A.id },
      { voter: p.F, selection: "*" },
    ]);

    expectAlive(p, { F: false, A: true });
    gameHasAlert(
      game,
      `${p.F.name} feels immensely frustrated`
    ).should.equal(true);
  });

  it("4b. a King's vote on F is not a minority: F survives", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "King",
      "Villager",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "K", role: "King" },
      { key: "A", role: "Villager" },
      { key: "V", role: "Villager" },
      { key: "W", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    // Weighted F=10000, A=3. Raw ballots would call F the lowest.
    play(game, [
      { voter: p.K, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.V, selection: p.A.id },
      { voter: p.W, selection: p.A.id },
      { voter: p.F, selection: "*" },
      { voter: p.M, selection: "*" },
    ]);

    expectAlive(p, { F: true, A: true, K: true });
    gameHasAlert(game, "feels immensely frustrated").should.equal(false);
  });

  it("5. tie for lowest does not kill F", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Villager",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "B", role: "Villager" },
      { key: "A", role: "Villager" },
      { key: "V", role: "Villager" },
      { key: "W", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    // F=1, B=1, A=3. A is condemned normally. F is not killed.
    play(game, [
      { voter: p.V, selection: p.F.id },
      { voter: p.W, selection: p.B.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.M, selection: p.A.id },
      { voter: p.F, selection: p.A.id },
      { voter: p.B, selection: "*" },
    ]);

    expectAlive(p, { F: true, B: true, A: false });
    gameHasAlert(game, "feels immensely frustrated").should.equal(false);
  });

  it("6. sole recipient does not die", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);
    p.F.getImmunity("condemn").should.be.at.least(3);

    play(game, [
      { voter: p.F, selection: p.F.id },
      { voter: p.A, selection: p.F.id },
      { voter: p.M, selection: p.F.id },
    ]);

    expectAlive(p, { F: true, A: true });
    gameHasAlert(game, "feels immensely frustrated").should.equal(false);
  });

  it("7. zero votes on F leaves the normal condemn", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    play(game, [
      { voter: p.F, selection: p.A.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.M, selection: p.A.id },
    ]);

    expectAlive(p, { F: true, A: false });
    gameHasAlert(game, "feels immensely frustrated").should.equal(false);
  });

  it("8. no-one ballots are ignored: F=1, A=2, three no-one", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Villager",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "N1", role: "Villager" },
      { key: "N2", role: "Villager" },
      { key: "N3", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    play(game, [
      { voter: p.M, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.N1, selection: p.A.id },
      { voter: p.F, selection: "*" },
      { voter: p.N2, selection: "*" },
      { voter: p.N3, selection: "*" },
    ]);

    expectAlive(p, { F: false, A: true });
    gameHasAlert(
      game,
      `${p.F.name} feels immensely frustrated`
    ).should.equal(true);
  });

  it("9. a self vote counts toward F", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    // Self vote makes F=1 against A=2. Without it, F has no votes.
    play(game, [
      { voter: p.F, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.M, selection: p.A.id },
    ]);

    expectAlive(p, { F: false, A: true });
    gameHasAlert(
      game,
      `${p.F.name} feels immensely frustrated`
    ).should.equal(true);
  });

  it("9b. a dead player's vote counts toward F", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "D", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    p.D.kill("basic", p.M, false);
    p.D.alive.should.equal(false);

    // D's vote is the only one on F. A=2. F dies only if that vote counts.
    play(game, [
      { voter: p.D, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.M, selection: p.A.id },
      { voter: p.F, selection: "*" },
    ]);

    expectAlive(p, { F: false, A: true });
    gameHasAlert(
      game,
      `${p.F.name} feels immensely frustrated`
    ).should.equal(true);
  });

  it("10. Unkillable Frustrated dies when lowest", async function () {
    const game = await makeGame([
      "Villager:Frustrated/Unkillable",
      "Villager",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      {
        key: "F",
        role: "Villager",
        modifier: "Frustrated/Unkillable",
      },
      { key: "A", role: "Villager" },
      { key: "V", role: "Villager" },
      { key: "W", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);
    p.F.hasEffect("Frustrated").should.equal(true);
    p.F.hasEffect("Kill Immune").should.equal(true);

    play(game, [
      { voter: p.V, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.W, selection: p.A.id },
      { voter: p.M, selection: p.A.id },
      { voter: p.F, selection: "*" },
    ]);

    expectAlive(p, { F: false, A: true });
    gameHasAlert(
      game,
      `${p.F.name} feels immensely frustrated`
    ).should.equal(true);
  });

  it("10b. Unkillable Frustrated survives when they have the most votes", async function () {
    const game = await makeGame([
      "Villager:Frustrated/Unkillable",
      "Villager",
      "Villager",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      {
        key: "F",
        role: "Villager",
        modifier: "Frustrated/Unkillable",
      },
      { key: "A", role: "Villager" },
      { key: "V", role: "Villager" },
      { key: "W", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    play(game, [
      { voter: p.F, selection: p.F.id },
      { voter: p.V, selection: p.F.id },
      { voter: p.W, selection: p.F.id },
      { voter: p.A, selection: p.A.id },
      { voter: p.M, selection: "*" },
    ]);

    expectAlive(p, { F: true, A: true });
    gameHasAlert(game, "feels immensely frustrated").should.equal(false);
  });

  it("11. Court and Caved In do not trigger; Village does", async function () {
    const game = await makeGame([
      "Villager:Frustrated",
      "Villager",
      "Mafioso",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "F", role: "Villager", modifier: "Frustrated" },
      { key: "A", role: "Villager" },
      { key: "M", role: "Mafioso" },
    ]);

    const count = { [p.F.id]: 1, [p.A.id]: 3 };
    const highest = { targets: [p.A.id], votes: 3 };
    const votes = {
      a: p.F.id,
      b: p.A.id,
      c: p.A.id,
      d: p.A.id,
    };
    const before = actionCount(game);

    game.events.emit(
      "PostVotingPowers",
      { name: "Court", votes: votes },
      count,
      highest
    );
    game.events.emit(
      "PostVotingPowers",
      { name: "Caved In", votes: votes },
      count,
      highest
    );
    actionCount(game).should.equal(before);
    p.F.alive.should.equal(true);

    game.events.emit(
      "PostVotingPowers",
      { name: "Village", votes: votes },
      count,
      highest
    );
    actionCount(game).should.equal(before + 1);
  });

  it("12. modifier text matches the weighted rule", function () {
    modifiers.Mafia.Frustrated.description.should.equal(
      "You cannot be condemned by majority vote. If you receive votes but fewer than every other player who received votes, you die instead, even if you are Unkillable. Vote weight counts."
    );
    modifiers.Mafia.Unkillable.description.should.equal(
      "You can only be killed by condemn (including a Frustrated death)."
    );
  });
});
