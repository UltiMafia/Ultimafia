const dotenv = require("dotenv").config();
const chai = require("chai"),
  should = chai.should(),
  expect = chai.expect;
const db = require("../../db/db");
const redis = require("../../modules/redis");
const shortid = require("shortid");
const MafiaGame = require("../../Games/types/Mafia/Game");
const LiarsDiceGame = require("../../Games/types/LiarsDice/Game");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const {
  findSpectatorChatMeeting,
  isSpectatorChatMeeting,
  pickSpeechTarget,
} = require("../../react_main/src/shared/spectatorChat");

// A spectator always has the chat box. A refresh is a new connection for the
// same user while the old spectator entry is still kept (reconnect grace), and
// it must bring the chat box back like a fresh join does.

function makeUser(id, name) {
  return new User({
    id: id || shortid.generate(),
    socket: new Socket(),
    name: name || shortid.generate(),
    settings: {},
    isTest: true,
  });
}

function events(socket, name) {
  return socket.clientMessages.filter((m) => m.eventName === name);
}

function settle(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms || 30));
}

// What the game page shows, from what this socket got: the last "history",
// then the "state", "meeting" and "leftMeeting" events after it, applied the
// way Game.jsx applies them. Returns the meeting "Say" would send to, or null
// when there is no chat box.
function chatBox(socket) {
  const all = socket.clientMessages;
  let at = -1;
  for (let i = all.length - 1; i >= 0; i--)
    if (all[i].eventName === "history") {
      at = i;
      break;
    }
  if (at == -1) return null;

  const states = {};
  for (const id in all[at].data)
    states[id] = { meetings: { ...all[at].data[id].meetings } };
  const ids = Object.keys(states).map(Number);
  let current = ids.includes(-2) ? -2 : Math.max(...ids);

  let isSpectator = false;
  for (const e of all)
    if (e.eventName === "isSpectator") isSpectator = e.data !== false;

  for (const e of all.slice(at + 1)) {
    if (e.eventName === "state") {
      if (!states[e.data.id]) states[e.data.id] = { meetings: {} };
      current = e.data.id;
    }
    if (e.eventName === "meeting") states[current].meetings[e.data.id] = e.data;
    if (e.eventName === "leftMeeting") delete states[current].meetings[e.data];
  }

  const meetings = states[current].meetings;
  // The default tab: the first speech meeting that is not spectator chat.
  const tab = Object.values(meetings).filter(
    (m) => m.speech && !isSpectatorChatMeeting(m),
  )[0];
  const target = pickSpeechTarget({
    activeMeeting: tab || null,
    spectatorMeeting: findSpectatorChatMeeting(meetings, isSpectator),
    isPregame: current == -1,
  });
  return target.meetingId;
}

function say(user, content, meetingId) {
  user.socket.sendToServer("speak", {
    content,
    meetingId: String(meetingId),
    abilityName: "",
    abilityTarget: "",
  });
}

function heard(user, content) {
  return events(user.socket, "message").some(
    (e) => e.data && e.data.content === content,
  );
}

// A browser refresh. "closeFirst": the old socket closes before the new one
// joins; otherwise the new one joins first and replaces the old one.
async function refresh(game, user, closeFirst) {
  const old = game.spectators.filter((s) => s.user.id === user.id)[0];
  expect(old, "spectator entry before refresh").to.exist;
  if (closeFirst) old.socket.sendToServer("disconnected");
  const again = makeUser(user.id, user.name);
  await game.userJoin(again);
  if (!closeFirst) user.socket.sendToServer("disconnected");
  return again;
}

const games = [];

async function mafiaGame() {
  const users = [makeUser(), makeUser(), makeUser(), makeUser(), makeUser()];
  const game = new MafiaGame({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: {
      setup: { total: 5, roles: [{ Villager: 4, Mafioso: 1 }] },
      stateLengths: { Day: 600000, Night: 600000 },
      pregameCountdownLength: 0,
      spectating: true,
    },
    isTest: true,
  });
  await game.init();
  games.push(game);
  await game.userJoin(users[0]);
  return {
    game,
    users,
    seatRest: async () => {
      for (const u of users.slice(1)) await game.userJoin(u);
    },
  };
}

// Night 1 ends when the Mafioso picks a target, which starts Day 1.
async function toDay(game) {
  const mafioso = game.players.array().find((p) => p.role.name == "Mafioso");
  const villager = game.players.array().find((p) => p.role.name == "Villager");
  const kill = [...game.meetings].find(
    (m) => m.voting && m.members[mafioso.id],
  );
  mafioso.user.socket.sendToServer("vote", {
    selection: villager.id,
    meetingId: kill.id,
  });
  await waitFor(() => game.getStateName() === "Day");
}

async function waitFor(check, ms) {
  const end = Date.now() + (ms || 5000);
  while (!check()) {
    if (Date.now() > end) throw new Error("timed out");
    await settle(10);
  }
}

describe("Spectator chat box after a refresh", function () {
  this.timeout(30000);

  before(async function () {
    await db.promise;
  });

  after(async function () {
    for (const game of games) {
      try {
        game.clearTimers();
        await game.cancel();
      } catch (e) {}
    }
    await redis.client.flushdb();
  });

  for (const closeFirst of [false, true]) {
    const order = closeFirst ? "old socket closes first" : "new socket first";

    it(`keeps the chat box in pregame (${order})`, async function () {
      const { game } = await mafiaGame();
      const spec = makeUser();
      const other = makeUser();
      await game.userJoin(spec, { spectate: true });
      await game.userJoin(other, { spectate: true });
      expect(chatBox(spec.socket)).to.equal(game.pregame.id);

      const again = await refresh(game, spec, closeFirst);
      game.spectators.should.have.lengthOf(2);
      expect(chatBox(again.socket), "chat box after refresh").to.equal(
        game.pregame.id,
      );

      say(again, "pregame hello after refresh", game.pregame.id);
      await settle();
      heard(other, "pregame hello after refresh").should.equal(true);
      heard(again, "pregame hello after refresh").should.equal(true);
      heard(
        game.players.array()[0].user,
        "pregame hello after refresh",
      ).should.equal(true);
    });

    for (const stateName of ["Day", "Night"]) {
      it(`keeps spectator chat at ${stateName} (${order})`, async function () {
        const { game, seatRest } = await mafiaGame();
        const spec = makeUser();
        const other = makeUser();
        await game.userJoin(spec, { spectate: true });
        await game.userJoin(other, { spectate: true });
        await seatRest();
        await waitFor(() => game.started && game.spectatorMeeting);
        game.getStateName().should.equal("Night");
        if (stateName === "Day") await toDay(game);

        const meetingId = game.spectatorMeeting.id;
        expect(chatBox(spec.socket), "before refresh").to.equal(meetingId);

        const again = await refresh(game, spec, closeFirst);
        expect(chatBox(again.socket), "chat box after refresh").to.equal(
          meetingId,
        );

        say(again, `${stateName} line after refresh`, meetingId);
        await settle();
        heard(other, `${stateName} line after refresh`).should.equal(true);
        heard(again, `${stateName} line after refresh`).should.equal(true);
        // Players never see spectator chat.
        for (const p of game.players)
          heard(p.user, `${stateName} line after refresh`).should.equal(false);

        // And they still hear the other spectator.
        say(other, `${stateName} reply`, meetingId);
        await settle();
        heard(again, `${stateName} reply`).should.equal(true);
      });
    }
  }

  it("keeps the chat box when the state changes after a refresh", async function () {
    const { game, seatRest } = await mafiaGame();
    const spec = makeUser();
    await game.userJoin(spec, { spectate: true });
    await seatRest();
    await waitFor(() => game.started && game.spectatorMeeting);

    const again = await refresh(game, spec, true);
    expect(chatBox(again.socket), "Night after refresh").to.equal(
      game.spectatorMeeting.id,
    );
    await toDay(game);
    expect(chatBox(again.socket), "Day after the refresh").to.equal(
      game.spectatorMeeting.id,
    );
    const twice = await refresh(game, again, false);
    expect(chatBox(twice.socket), "Day after a second refresh").to.equal(
      game.spectatorMeeting.id,
    );
  });

  it("keeps the chat box for a Liars Dice spectator after a refresh", async function () {
    const users = [makeUser(), makeUser(), makeUser()];
    const game = new LiarsDiceGame({
      id: shortid.generate(),
      hostId: users[0].id,
      settings: {
        setup: { total: 3, roles: [{ "Liar:": 3 }] },
        stateLengths: { "Guess Dice": 600000 },
        pregameCountdownLength: 0,
        spectating: true,
        startingDice: 3,
      },
      isTest: true,
    });
    await game.init();
    games.push(game);
    await game.userJoin(users[0]);
    const spec = makeUser();
    const other = makeUser();
    await game.userJoin(spec, { spectate: true });
    await game.userJoin(other, { spectate: true });
    expect(chatBox(spec.socket)).to.equal(game.pregame.id);
    let again = await refresh(game, spec, false);
    expect(chatBox(again.socket), "pregame refresh").to.equal(game.pregame.id);

    for (const u of users.slice(1)) await game.userJoin(u);
    await waitFor(() => game.started && game.spectatorMeeting);
    again = await refresh(game, again, true);
    const meetingId = game.spectatorMeeting.id;
    expect(chatBox(again.socket), "in-game refresh").to.equal(meetingId);
    say(again, "dice spectator line", meetingId);
    await settle();
    heard(other, "dice spectator line").should.equal(true);
  });
});
