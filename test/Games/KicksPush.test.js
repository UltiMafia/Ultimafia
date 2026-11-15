const dotenv = require("dotenv").config();
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

async function displayAndClick(payload) {
  const listeners = {};
  const shown = [];
  const opened = [];
  const self = {
    location: { origin: new URL(process.env.BASE_URL).origin },
    addEventListener: (kind, handler) => { listeners[kind] = handler; },
    skipWaiting() {},
    registration: {
      showNotification: async (title, options) => { shown.push({ title, options }); },
    },
    clients: {
      matchAll: async () => [],
      openWindow: async (url) => { opened.push(url); },
    },
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "../../react_main/public/sw.js"), "utf8"),
    { self, URL, console }
  );
  let pending;
  listeners.push({
    data: { json: () => payload },
    waitUntil: (promise) => { pending = promise; },
  });
  await pending;
  expect(shown).to.have.lengthOf(1);
  listeners.notificationclick({
    notification: { ...shown[0].options, close() {} },
    waitUntil: (promise) => { pending = promise; },
  });
  await pending;
  return { shown: shown[0], opened };
}

require("../helpers/pushConfig");

const db = require("../../db/db");
const Game = require("../../Games/core/Game");
const Meeting = require("../../Games/core/Meeting");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;
const webpush = require("web-push");
const push = require("../../modules/pushNotifications");

function subscription(id) {
  return {
    endpoint: `https://push.example.com/${id}`,
    keys: { p256dh: "test-key", auth: "test-auth" },
  };
}

// Like SpectateJoin.test.js, use real Game/User/Player/Meeting instances and
// TestSocket. Only the outbound push transport is replaced; checkVeg(), the
// recipient predicate, dedupe and subscription registry all run as shipped.
describe("Games/KicksPush", function () {
  this.timeout(20000);
  let game;
  let originalSend;
  let attempts;
  let userIds;
  let sequence = 0;

  before(async function () {
    await db.promise;
  });

  beforeEach(async function () {
    attempts = [];
    userIds = [];
    originalSend = webpush.sendNotification;
    webpush.sendNotification = async (sub, payload) => {
      attempts.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
    };
    const id = `kicks-push-${process.pid}-${++sequence}`;
    game = new Game({
      id,
      hostId: `${id}-host`,
      settings: {
        setup: { id: "setup", total: 12 },
        private: true,
        spectating: true,
        readyCheck: false,
        stateLengths: { Day: 1000, Night: 1000 },
      },
      isTest: true,
    });
    await game.init();
    game.checkGameStart = () => {};
    // Hold the phase at its ready boundary, not the kicks trigger itself.
    game.gotoNextState = () => {};
  });

  afterEach(async function () {
    webpush.sendNotification = originalSend;
    for (const id of userIds) push.unregisterUser(id);
    if (game) {
      game.clearTimers();
      await game.cancel();
    }
  });

  async function join(name, { spectator = false, subscribed = true } = {}) {
    const id = `${game.id}-${name}`;
    userIds.push(id);
    const user = new User({ id, name, settings: {}, socket: new Socket() });
    await game.userJoin(user, { spectate: spectator });
    if (subscribed) expect(push.register(id, subscription(id))).to.equal(true);
    return spectator
      ? game.spectators.find((p) => p.user.id === id)
      : game.players.array().find((p) => p.user.id === id);
  }

  function actions(players) {
    game.states.push({ name: "Day" });
    for (let state = 0; state <= 2; state++) {
      game.currentState = state;
      game.addStateToHistories(state === 2 ? "Day 1" : "Pregame", state);
    }
    const meeting = game.createMeeting(Meeting, "Pending actions");
    meeting.voting = true;
    meeting.group = true;
    meeting.noVeg = false;
    for (const player of players) meeting.join(player);
    return meeting;
  }

  async function settle() {
    // checkVeg intentionally does not await push; drain its async send/report.
    await new Promise((resolve) => setImmediate(resolve));
  }

  it("sends once to an incomplete player, excluding acted, kicked, bot, spectator and opted-out users", async function () {
    const pending = await join("pending");
    const acted = await join("acted");
    const kicked = await join("kicked");
    const bot = await join("bot");
    const optedOut = await join("opted-out");
    const neverSubscribed = await join("never-subscribed", { subscribed: false });
    const spectator = await join("spectator", { spectator: true });
    const meeting = actions([pending, acted, kicked, bot, optedOut, neverSubscribed]);
    meeting.votes[acted.id] = pending.id;
    kicked.alive = false;
    bot.isBot = true;
    // The existing opt-out is unsubscribe; there is no per-kind preference.
    push.unregisterUser(optedOut.user.id);

    game.checkVeg();
    game.checkVeg();
    await settle();

    expect(attempts).to.have.lengthOf(1);
    expect(attempts[0].endpoint).to.equal(subscription(pending.user.id).endpoint);
    expect(attempts[0].payload).to.include({
      kind: "kicks-reminder",
      gameId: game.id,
      state: game.currentState,
      tag: `game-${game.id}`,
      url: `${process.env.BASE_URL || ""}/game/${game.id}`,
    });
    expect(game.kicksReminderSent.has(`${game.id}:${game.currentState}:${pending.user.id}:kicks`)).to.equal(true);
    expect(game.vegKickMeeting.members[spectator.id]).to.equal(undefined);
  });

  it("reminds anonymous accounts once each across double fire and real reconnect", async function () {
    const players = [await join("anonymous-one"), await join("anonymous-two")];
    const accounts = players.map((player) => player.user.id);
    game.anonymousGame = true;
    game.anonymousDeck = [{
      name: "Test deck",
      profiles: [
        { id: 0, name: "Anonymous Cat", color: "#aaa" },
        { id: 1, name: "Anonymous Dog", color: "#bbb" },
      ],
    }];
    game.makeGameAnonymous();
    game.started = true;
    actions(players);
    // Reconnect sends the phase snapshot; populate the state-index ledger that
    // gotoNextState normally records (the fixture holds that boundary).
    game.stateIndexRecord[game.currentState] = game.states.length - 1;

    async function reconnect(index) {
      const socket = new Socket();
      await game.userJoin(new User({
        id: accounts[index], name: "Reconnected account", settings: {}, socket,
      }));
      expect(game.players.length).to.equal(2);
      expect(players[index].socket).to.equal(socket);
      expect(players[index].user).not.to.have.property("id");
      expect(players[index].originalProfile.userId).to.equal(accounts[index]);
    }

    await reconnect(0);
    for (const account of accounts) expect(push.hasSubscription(account)).to.equal(true);
    game.checkVeg();
    game.checkVeg();
    await settle();
    expect(attempts.map((attempt) => attempt.endpoint).sort()).to.deep.equal(
      accounts.map((account) => subscription(account).endpoint).sort()
    );
    expect([...game.kicksReminderSent].sort()).to.deep.equal(
      accounts.map((account) => `${game.id}:${game.currentState}:${account}:kicks`).sort()
    );
    for (const attempt of attempts) {
      const encoded = JSON.stringify(attempt.payload);
      for (const account of accounts) expect(encoded).not.to.include(account);
    }

    await reconnect(1);
    game.checkVeg();
    await settle();
    expect(attempts).to.have.lengthOf(2);
  });

  it("retains the pregame subscription across start so the later kicks reminder can deliver", async function () {
    const pending = await join("pending");
    // Same core-Game start fixture as SpectateJoin: role assignment belongs to
    // game-type subclasses, while subscription lifetime belongs to core Game.
    game.assignRoles = () => {};
    game.captureStartingFactions = () => {};
    game.setup.total = game.players.length;
    await game.start();
    expect(game.started).to.equal(true);
    expect(push.hasSubscription(pending.user.id)).to.equal(true);
    // start also emits the existing game-starting push; check kicks separately.
    await settle();
    attempts.length = 0;
    actions([pending]);
    game.checkVeg();
    await settle();
    expect(attempts).to.have.lengthOf(1);
    expect(attempts[0].payload.kind).to.equal("kicks-reminder");
  });

  it("delivers the real checkVeg payload through the shipped worker to the actions deep link", async function () {
    const pending = await join("pending");
    actions([pending]);
    game.checkVeg();
    await settle();
    expect(attempts).to.have.lengthOf(1);
    const { shown, opened } = await displayAndClick(attempts[0].payload);
    expect(shown.title).to.equal("Your game is in kicks");
    expect(shown.options.tag).to.equal(`game-${game.id}`);
    expect(shown.options.body).to.equal(attempts[0].payload.body);
    expect(opened).to.deep.equal([
      `${process.env.BASE_URL}/game/${game.id}?panel=actions`,
    ]);
  });

  it("keeps the existing ready push on the plain game deep link", async function () {
    await join("pending");
    game.pushToPlayers({ kind: "ready-check", title: "Your game is ready!" });
    await settle();
    expect(attempts).to.have.lengthOf(1);
    const { shown, opened } = await displayAndClick(attempts[0].payload);
    expect(shown.title).to.equal("Your game is ready!");
    expect(shown.options.tag).to.equal(`game-${game.id}`);
    expect(opened).to.deep.equal([`${process.env.BASE_URL}/game/${game.id}`]);
  });

  it("claims before an in-flight transport resolves so reentrant retries cannot send twice", async function () {
    const pending = await join("pending");
    actions([pending]);
    let release;
    webpush.sendNotification = (sub, payload) => {
      attempts.push(JSON.parse(payload));
      return new Promise((resolve) => { release = resolve; });
    };
    try {
      game.checkVeg();
      game.checkVeg();
      expect(attempts).to.have.lengthOf(1);
      expect(game.kicksReminderSent.size).to.equal(1);
    } finally {
      if (release) release();
      await settle();
    }
  });

  it("does not retry a failed delivery in the same kicks window", async function () {
    const pending = await join("pending");
    actions([pending]);
    webpush.sendNotification = async () => {
      attempts.push("failed");
      throw Object.assign(new Error("unavailable"), { statusCode: 503 });
    };
    game.checkVeg();
    await settle();
    game.checkVeg();
    await settle();
    expect(attempts).to.deep.equal(["failed"]);
    expect(push.hasSubscription(pending.user.id)).to.equal(true);
  });

  it("captures recipients and payload before the ready boundary advances the state", async function () {
    const pending = await join("pending");
    actions([pending]);
    const state = game.currentState;
    game.checkAllMeetingsReady = () => {
      game.currentState += 1;
      pending.alive = false;
    };
    const logger = require("../../modules/logging")("games");
    const originalInfo = logger.info;
    const logs = [];
    let release;
    logger.info = (message) => { logs.push(JSON.parse(message)); };
    webpush.sendNotification = (sub, payload) => {
      attempts.push({ endpoint: sub.endpoint, payload: JSON.parse(payload) });
      return new Promise((resolve) => { release = resolve; });
    };
    try {
      game.checkVeg();
      expect(game.currentState).to.equal(state + 1);
      expect(logs).to.have.lengthOf(0);
      expect(attempts).to.have.lengthOf(1);
      expect(attempts[0].payload.state).to.equal(state);
      expect(game.kicksReminderSent.has(`${game.id}:${state}:${pending.user.id}:kicks`)).to.equal(true);
      release();
      await settle();
      expect(logs).to.have.lengthOf(1);
      expect(logs[0]).to.include({ event: "kicks-push", gameId: game.id, state });
    } finally {
      if (release) release();
      await settle();
      logger.info = originalInfo;
    }
  });

  it("does not notify a player whose last-second action is complete at kicks entry", async function () {
    const pending = await join("pending");
    const meeting = actions([pending]);
    meeting.votes[pending.id] = "*";
    game.checkVeg();
    await settle();
    expect(attempts).to.have.lengthOf(0);
  });

  it("does not notify in a noVeg game", async function () {
    const pending = await join("pending");
    actions([pending]);
    game.noVeg = true;
    game.checkVeg();
    await settle();
    expect(attempts).to.have.lengthOf(0);
  });
});
