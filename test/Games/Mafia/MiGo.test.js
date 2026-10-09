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
  return { total: roleNames.length, roles: [counts] };
}

async function makeGame(roleNames) {
  const users = roleNames.map(() => makeUser());
  const game = new Game({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: setupFrom(roleNames),
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

function addRoleChoice(game, roleName) {
  if (game.PossibleRoles.indexOf(roleName) === -1) {
    game.PossibleRoles.push(roleName);
  }
  for (let meeting of game.meetings) {
    if (meeting.inputType === "AllRoles" && meeting.generateTargets) {
      meeting.generateTargets();
    }
  }
}

function openMeetings(game) {
  return game
    .getMeetings()
    .filter((m) => m.voting && !m.ready)
    .map((m) => m.name)
    .join(",");
}

// Votes are cast on the meeting objects directly. No socket listener, so a
// later Day or Night cannot auto-vote and spin the state machine.
function voteNight(game, plan) {
  expect(game.finished, "game ended before night votes").to.equal(false);
  expect(game.getStateName(), "expected a night").to.equal("Night");

  const steps = plan.map((step) => {
    const meeting = game.getMeetingByName(step.name);
    expect(meeting, `missing ${step.name}`).to.exist;
    return { name: step.name, meeting, ballots: step.ballots };
  });

  for (let step of steps) {
    for (let ballot of step.ballots) {
      const ok = step.meeting.vote(ballot.voter, ballot.selection);
      expect(ok, `${step.name} rejected ${ballot.selection}`).to.equal(
        true
      );
    }
  }
}

function yesVotes(players) {
  return players.map((voter) => ({ voter, selection: "Yes" }));
}

function passDay(game) {
  expect(game.getStateName(), openMeetings(game)).to.equal("Day");
  const meeting = game.getMeetingByName("Village");
  expect(meeting, "no Village meeting").to.exist;
  // Village.vote does not return the super.vote result.
  for (let player of game.players) {
    meeting.vote(player, "*");
    if (game.getStateName() === "Night") return;
    expect(meeting.votes[player.id], "no-one vote missing").to.equal("*");
  }
  expect(game.getStateName(), "day did not end").to.equal("Night");
}

function hasDemonic(player) {
  const mod = (player.role && player.role.modifier) || "";
  return mod.split("/").indexOf("Demonic") !== -1;
}

const CULT = ["Mi-Go", "Imp:Demonic", "Villager", "Villager", "Villager"];

describe("Games/Mafia Mi-Go demon conversion", function () {
  this.timeout(30000);

  beforeEach(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
  });

  afterEach(function () {
    if (this.game) this.game.clearTimers();
  });

  it("cancels the Imp kill on conversion to another Demon", async function () {
    const game = await makeGame(CULT);
    this.game = game;
    addRoleChoice(game, "Lamia:Demonic");
    const p = takePlayers(game, [
      { key: "migo", role: "Mi-Go" },
      { key: "imp", role: "Imp", modifier: "Demonic" },
      { key: "victim", role: "Villager" },
    ]);

    voteNight(game, [
      {
        name: "Select Player",
        ballots: [{ voter: p.migo, selection: p.imp.id }],
      },
      {
        name: "Convert To",
        ballots: [{ voter: p.migo, selection: "Lamia:Demonic" }],
      },
      {
        name: "Kill",
        ballots: [{ voter: p.imp, selection: p.victim.id }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.migo, p.imp]),
      },
    ]);

    expect(p.victim.alive, openMeetings(game)).to.equal(true);
    expect(p.imp.role.name).to.equal("Lamia");
    expect(hasDemonic(p.imp)).to.equal(true);
  });

  it("lets the new Demon's kill resolve on the next night", async function () {
    const game = await makeGame(CULT);
    this.game = game;
    addRoleChoice(game, "Lamia:Demonic");
    const p = takePlayers(game, [
      { key: "migo", role: "Mi-Go" },
      { key: "imp", role: "Imp", modifier: "Demonic" },
      { key: "first", role: "Villager" },
      { key: "second", role: "Villager" },
    ]);

    voteNight(game, [
      {
        name: "Select Player",
        ballots: [{ voter: p.migo, selection: p.imp.id }],
      },
      {
        name: "Convert To",
        ballots: [{ voter: p.migo, selection: "Lamia:Demonic" }],
      },
      {
        name: "Kill",
        ballots: [{ voter: p.imp, selection: p.first.id }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.migo, p.imp]),
      },
    ]);

    expect(p.first.alive, openMeetings(game)).to.equal(true);
    expect(p.imp.role.name).to.equal("Lamia");
    passDay(game);

    // * closes Mi-Go's meetings without a second conversion.
    voteNight(game, [
      {
        name: "Select Player",
        ballots: [{ voter: p.migo, selection: "*" }],
      },
      {
        name: "Convert To",
        ballots: [{ voter: p.migo, selection: "*" }],
      },
      {
        name: "Kill and Delirate",
        ballots: [{ voter: p.imp, selection: p.second.id }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.migo, p.imp]),
      },
    ]);

    expect(p.first.alive).to.equal(true);
    expect(p.second.alive, openMeetings(game)).to.equal(false);
    expect(p.imp.role.name).to.equal("Lamia");
    expect(hasDemonic(p.imp)).to.equal(true);
  });

  it("does not cancel kills when converting a non-Demon", async function () {
    const game = await makeGame(CULT);
    this.game = game;
    addRoleChoice(game, "Cultist");
    const p = takePlayers(game, [
      { key: "migo", role: "Mi-Go" },
      { key: "imp", role: "Imp", modifier: "Demonic" },
      { key: "converted", role: "Villager" },
      { key: "victim", role: "Villager" },
    ]);

    voteNight(game, [
      {
        name: "Select Player",
        ballots: [{ voter: p.migo, selection: p.converted.id }],
      },
      {
        name: "Convert To",
        ballots: [{ voter: p.migo, selection: "Cultist" }],
      },
      {
        name: "Kill",
        ballots: [{ voter: p.imp, selection: p.victim.id }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.migo, p.imp]),
      },
    ]);

    expect(p.victim.alive, openMeetings(game)).to.equal(false);
    expect(p.imp.role.name).to.equal("Imp");
    expect(p.converted.role.name).to.equal("Cultist");
  });

  it("does not cancel when a Demon becomes a non-Demon", async function () {
    const game = await makeGame(CULT);
    this.game = game;
    addRoleChoice(game, "Cultist");
    const p = takePlayers(game, [
      { key: "migo", role: "Mi-Go" },
      { key: "imp", role: "Imp", modifier: "Demonic" },
      { key: "victim", role: "Villager" },
    ]);

    voteNight(game, [
      {
        name: "Select Player",
        ballots: [{ voter: p.migo, selection: p.imp.id }],
      },
      {
        name: "Convert To",
        ballots: [{ voter: p.migo, selection: "Cultist" }],
      },
      {
        name: "Kill",
        ballots: [{ voter: p.imp, selection: p.victim.id }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.migo, p.imp]),
      },
    ]);

    expect(p.victim.alive, openMeetings(game)).to.equal(false);
    expect(p.imp.role.name).to.equal("Cultist");
  });

  it("lets the kill resolve if the role is already in play", async function () {
    const game = await makeGame([
      "Mi-Go",
      "Imp:Demonic",
      "Lamia",
      "Villager",
      "Villager",
      "Villager",
      "Villager",
    ]);
    this.game = game;
    addRoleChoice(game, "Lamia:Demonic");
    const p = takePlayers(game, [
      { key: "migo", role: "Mi-Go" },
      { key: "imp", role: "Imp", modifier: "Demonic" },
      { key: "lamia", role: "Lamia" },
      { key: "victim", role: "Villager" },
    ]);

    // A plain Lamia blocks Lamia:Demonic (name before ":" is already in play).
    voteNight(game, [
      {
        name: "Select Player",
        ballots: [{ voter: p.migo, selection: p.imp.id }],
      },
      {
        name: "Convert To",
        ballots: [{ voter: p.migo, selection: "Lamia:Demonic" }],
      },
      {
        name: "Kill",
        ballots: [{ voter: p.imp, selection: p.victim.id }],
      },
      {
        name: "Kill and Delirate",
        ballots: [{ voter: p.lamia, selection: "*" }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.migo, p.imp, p.lamia]),
      },
    ]);

    expect(p.victim.alive, openMeetings(game)).to.equal(false);
    expect(p.imp.role.name).to.equal("Imp");
    expect(hasDemonic(p.imp)).to.equal(true);
    expect(p.lamia.role.name).to.equal("Lamia");
  });

  it("lets the kill resolve when Mi-Go is roleblocked", async function () {
    const game = await makeGame([
      "Mi-Go",
      "Imp:Demonic",
      "Hooker",
      "Villager",
      "Villager",
    ]);
    this.game = game;
    addRoleChoice(game, "Lamia:Demonic");
    const p = takePlayers(game, [
      { key: "migo", role: "Mi-Go" },
      { key: "imp", role: "Imp", modifier: "Demonic" },
      { key: "hooker", role: "Hooker" },
      { key: "victim", role: "Villager" },
    ]);

    voteNight(game, [
      {
        name: "Block",
        ballots: [{ voter: p.hooker, selection: p.migo.id }],
      },
      {
        name: "Mafia Kill",
        ballots: [{ voter: p.hooker, selection: "*" }],
      },
      {
        name: "Select Player",
        ballots: [{ voter: p.migo, selection: p.imp.id }],
      },
      {
        name: "Convert To",
        ballots: [{ voter: p.migo, selection: "Lamia:Demonic" }],
      },
      {
        name: "Kill",
        ballots: [{ voter: p.imp, selection: p.victim.id }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.migo, p.imp]),
      },
    ]);

    expect(p.victim.alive, openMeetings(game)).to.equal(false);
    expect(p.imp.role.name).to.equal("Imp");
    expect(hasDemonic(p.imp)).to.equal(true);
    expect(p.migo.role.name).to.equal("Mi-Go");
  });

  it("leaves the kill alone for a non-Mi-Go converter", async function () {
    const game = await makeGame([
      "Enchantress",
      "Imp:Demonic",
      "Villager",
      "Villager",
      "Villager",
    ]);
    this.game = game;
    const p = takePlayers(game, [
      { key: "enchantress", role: "Enchantress" },
      { key: "imp", role: "Imp", modifier: "Demonic" },
      { key: "victim", role: "Villager" },
    ]);
    p.enchantress.role.getAllRoles = function () {
      return ["Lamia:Demonic"];
    };

    voteNight(game, [
      {
        name: "Transmute",
        ballots: [{ voter: p.enchantress, selection: p.imp.id }],
      },
      {
        name: "Kill",
        ballots: [{ voter: p.imp, selection: p.victim.id }],
      },
      {
        name: "Cult Action",
        ballots: yesVotes([p.enchantress, p.imp]),
      },
    ]);

    expect(p.victim.alive, openMeetings(game)).to.equal(false);
    expect(p.imp.role.name, openMeetings(game)).to.equal("Lamia");
    expect(hasDemonic(p.imp)).to.equal(true);
  });
});
