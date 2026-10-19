const chai = require("chai"),
  should = chai.should();
const db = require("../../../db/db");
const redis = require("../../../modules/redis");
const SecretDictatorGame = require("../../../Games/types/SecretDictator/Game");
const { makeGame, waitFor, meetingOf, vote, seedChat } = require("../../../scripts/gameSim/harness");
const bot = require("../../../scripts/gameSim/secretDictatorBot");

const tick = () => new Promise((r) => setTimeout(r, 15));

async function startGame(players = 5) {
  const L = 60000;
  const roles =
    players >= 7
      ? { "Liberal:": players - 3, "Fascist:": 2, "Dictator:": 1 }
      : { "Liberal:": players - 2, "Fascist:": 1, "Dictator:": 1 };
  const made = await makeGame(SecretDictatorGame, {
    players,
    setup: { total: players, roles: [roles] },
    settings: {
      stateLengths: {
        Nomination: L,
        Election: L,
        "Legislative Session": L,
        "Executive Action": L,
      },
    },
  });
  await waitFor(() => made.game.started && made.game.getStateName() == "Nomination");
  return made;
}

async function step(game, only, rng) {
  const acted = bot.act(game, rng, only);
  await tick();
  return acted;
}

async function electGovernment(game) {
  await step(game, (m) => m.name == "Nominate Chancellor");
  game.getStateName().should.equal("Election");
  const meeting = game.history.getMeetings().find((m) => m.name == "Election Vote");
  for (const member of Array.from(meeting.members)) vote(member.player, meeting, "Ja!");
  await tick();
  game.getStateName().should.equal("Legislative Session");
}

function holderOf(game, name) {
  return game.players.array().find((p) => meetingOf(p, name));
}

function government(game) {
  return game.history.getMeetings().find((m) => m.name == "Government");
}

describe("Games/SecretDictator engine", function () {
  this.timeout(60000);

  before(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
  });

  it("updates the board in place when the president discards", async function () {
    const { game, meter } = await startGame();
    await electGovernment(game);
    const state = game.currentState;
    const discardsBefore = game.drawDiscardPile.getDiscardPileSize();
    const president = holderOf(game, "Discard Policy");
    meter.reset();

    vote(president, meetingOf(president, "Discard Policy"), meetingOf(president, "Discard Policy").targets[0]);
    await tick();

    game.currentState.should.equal(state);
    meter.byEvent.state.frames.should.equal(game.players.length);
    game.history.states[state].extraInfo.deckInfo.discardSize.should.equal(discardsBefore + 1);
    should.exist(holderOf(game, "Enact Policy"));
    holderOf(game, "Enact Policy").should.equal(game.lastElectedChancellor);
  });

  it("does not resend the chat when a card is picked, however long the chat is", async function () {
    const perPick = {};
    for (const n of [50, 500]) {
      const { game, meter } = await startGame();
      await electGovernment(game);
      seedChat(game, "Government", n);
      const president = holderOf(game, "Discard Policy");
      meter.reset();
      const discard = meetingOf(president, "Discard Policy");
      vote(president, discard, discard.targets[0]);
      await tick();
      perPick[n] = meter.snapshot();
      const chatId = government(game).id;
      const resent = Object.keys(perPick[n].byEvent).includes("meeting")
        ? perPick[n].byEvent.meeting.bytes
        : 0;
      resent.should.be.below(4000);
      chatId.should.be.a("string");
    }
    perPick[500].frames.should.equal(perPick[50].frames);
    Math.abs(perPick[500].bytes - perPick[50].bytes).should.be.below(400);
  });

  it("vetoes the agenda when the president assents", async function () {
    const { game } = await startGame();
    game.vetoUnlocked = true;
    await electGovernment(game);
    const tracker = game.electionTracker;
    const discards = game.drawDiscardPile.getDiscardPileSize();
    const president = holderOf(game, "Discard Policy");
    vote(president, meetingOf(president, "Discard Policy"), meetingOf(president, "Discard Policy").targets[0]);
    await tick();

    const chancellor = holderOf(game, "Enact Policy");
    meetingOf(chancellor, "Enact Policy").targets.should.include("Veto Agenda");
    vote(chancellor, meetingOf(chancellor, "Enact Policy"), "Veto Agenda");
    await tick();

    vote(president, meetingOf(president, "Assent Veto"), "Yes");
    await tick();

    game.electionTracker.should.equal(tracker + 1);
    game.drawDiscardPile.getDiscardPileSize().should.equal(discards + 3);
    game.numLiberalPolicyEnacted.should.equal(0);
    game.numFascistPolicyEnacted.should.equal(0);
    game.getStateName().should.equal("Nomination");
  });

  it("makes the chancellor enact without a veto when the president refuses", async function () {
    const { game } = await startGame();
    game.vetoUnlocked = true;
    await electGovernment(game);
    const president = holderOf(game, "Discard Policy");
    vote(president, meetingOf(president, "Discard Policy"), meetingOf(president, "Discard Policy").targets[0]);
    await tick();
    const chancellor = holderOf(game, "Enact Policy");
    vote(chancellor, meetingOf(chancellor, "Enact Policy"), "Veto Agenda");
    await tick();

    vote(president, meetingOf(president, "Assent Veto"), "No");
    await tick();

    const noVeto = meetingOf(chancellor, "Enact Policy (No Veto)");
    should.exist(noVeto);
    noVeto.targets.should.not.include("Veto Agenda");
    const enacted = game.numLiberalPolicyEnacted + game.numFascistPolicyEnacted;
    vote(chancellor, noVeto, noVeto.targets[0]);
    await tick();
    (game.numLiberalPolicyEnacted + game.numFascistPolicyEnacted).should.equal(enacted + 1);
  });

  it("throws the country into chaos after three failed elections", async function () {
    const { game } = await startGame();
    for (let round = 0; round < 3; round++) {
      await step(game, (m) => m.name == "Nominate Chancellor");
      const meeting = game.history.getMeetings().find((m) => m.name == "Election Vote");
      for (const member of Array.from(meeting.members)) vote(member.player, meeting, "Nein!");
      await tick();
    }
    (game.numLiberalPolicyEnacted + game.numFascistPolicyEnacted).should.equal(1);
    game.electionTracker.should.equal(0);
  });

  it("ends with a Liberal win when the Dictator is executed", async function () {
    const { game } = await startGame();
    game.presidentialPowersBoard[1] = "Execute";
    await electGovernment(game);
    const president = holderOf(game, "Discard Policy");
    const discard = meetingOf(president, "Discard Policy");
    game.policyPile = ["Fascist", "Fascist", "Fascist"];
    discard.targets = game.policyPile.slice();
    vote(president, discard, "Fascist");
    await tick();
    const chancellor = holderOf(game, "Enact Policy");
    vote(chancellor, meetingOf(chancellor, "Enact Policy"), "Fascist");
    await tick();

    game.getStateName().should.equal("Executive Action");
    const dictator = game.players.array().find((p) => p.role.name == "Dictator");
    const execute = meetingOf(president, "Execute");
    if (dictator == president) this.skip();
    vote(president, execute, dictator.id);
    await tick();

    game.finished.should.be.true;
    dictator.alive.should.be.false;
    game.history.states[-2].winners.groups.should.include("Liberals");
  });

  it("plays full bot games to a winner", async function () {
    for (const players of [5, 7]) {
      const { game } = await startGame(players);
      let steps = 0;
      while (!game.finished && steps < 600) {
        await step(game);
        steps += 1;
      }
      game.finished.should.be.true;
      const winners = game.history.states[-2].winners.groups;
      winners.length.should.equal(1);
      ["Liberals", "Fascists"].should.include(winners[0]);
    }
  });
});
