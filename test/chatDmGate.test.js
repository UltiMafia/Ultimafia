// End to end: runs modules/chat.js in a child process and drives it over
// real sockets to check the in-game DM lock (modules/dmGate.js) and that one
// user can hold two chat sockets at once.
const chai = require("chai"),
  expect = chai.expect;
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");
const db = require("../db/db");
const redis = require("../modules/redis");
const models = require("../db/models");
const { stringifyMessage, parseMessage } = require("../lib/sockets");

const PORT = 3900 + Math.floor(Math.random() * 90);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function client(userId) {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
  const events = [];
  const c = {
    events,
    send: (e, d) => ws.send(stringifyMessage(e, d)),
    close: () => ws.terminate(),
    async waitFor(name, pred = () => true, ms = 4000) {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        const hit = events.find(([e, d]) => e === name && pred(d));
        if (hit) return hit[1];
        await sleep(25);
      }
      throw new Error(`no ${name} for ${userId}`);
    },
    clear: () => events.splice(0),
    // The server rate-limits chat to one message per 500ms per user.
    async say(text) {
      await sleep(600);
      c.send("sendMessage", text);
    },
  };
  c.ready = new Promise((resolve) => {
    ws.on("message", async (raw) => {
      raw = raw.toString();
      if (raw === "p") return ws.send("p");
      const [e, d] = parseMessage(raw);
      events.push([e, d]);
      if (e === "connected") c.send("auth", await redis.createAuthToken(userId));
      if (e === "chatInfo") resolve(d);
    });
  });
  return c;
}

describe("Chat server DM lock", function () {
  this.timeout(30000);
  let proc;
  const ids = ["dmA", "dmB", "dmC"];

  before(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
    await models.User.deleteMany({ id: { $in: ids } });
    await models.ChatChannel.deleteMany({ memberIds: { $in: ids } });
    await models.ChannelOpen.deleteMany({ user: { $in: ids } });
    await models.Notification.deleteMany({ user: { $in: ids } });
    for (const id of ids) {
      await models.User.create({ id, name: id, deleted: false, joined: Date.now(), settings: {} });
      await redis.cacheUserInfo(id, true);
    }
    proc = spawn(process.execPath, [path.join(__dirname, "../modules/chat.js")], {
      env: { ...process.env, CHAT_PORT: String(PORT), SOCKET_PING_INTERVAL: "60000", SERVER_SOCKET_PING_INTERVAL: "60000" },
      stdio: "ignore",
    });
    for (let i = 0; i < 60; i++) {
      await sleep(100);
      const ok = await new Promise((res) => {
        const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
        ws.on("open", () => { ws.terminate(); res(true); });
        ws.on("error", () => res(false));
      });
      if (ok) return;
    }
    throw new Error("chat server did not start");
  });

  after(async function () {
    if (proc) proc.kill("SIGKILL");
    await models.User.deleteMany({ id: { $in: ids } });
    await models.ChatChannel.deleteMany({ memberIds: { $in: ids } });
    await models.ChannelOpen.deleteMany({ user: { $in: ids } });
    await models.Notification.deleteMany({ user: { $in: ids } });
    await models.ChatMessage.deleteMany({ senderId: { $in: ids } });
    await models.Ban.deleteMany({ userId: { $in: ids } });
  });

  async function seatInRankedGame(userId, status) {
    await redis.createGame("gRank", {
      type: "Mafia", port: 1, status, hostId: userId,
      settings: { setup: "s", ranked: true, competitive: false }, createTime: Date.now(),
    });
    await redis.setGameState("gRank", status === "Open" ? "Pregame" : "Day");
    // Same as a real join: seat + gameAuto ban that removes privateChat.
    await redis.joinGame(userId, "gRank", true, false);
  }

  let a, a2, b, channelId;

  it("opens a group DM and delivers to every socket of a user", async function () {
    a = client("dmA"); b = client("dmB"); a2 = client("dmA");
    await Promise.all([a.ready, b.ready, a2.ready]);
    a.send("newDMChannel", ["dmB", "dmC"]);
    const info = await a.waitFor("newDirectChannel");
    channelId = info.channel.id;
    expect(channelId).to.have.lengthOf(32);
    expect(info.channel.members.map((m) => m.id).sort()).to.deep.equal(ids);

    for (const s of [a, a2, b]) s.send("getChannel", channelId);
    await a.waitFor("channel"); await a2.waitFor("channel"); await b.waitFor("channel");
    await b.say("hello group");
    for (const s of [a, a2, b])
      await s.waitFor("message", (m) => m.content === "hello group");
  });

  it("allows DMs while waiting in a ranked pregame lobby", async function () {
    await seatInRankedGame("dmA", "Open");
    a.clear();
    await a.say("from the lobby");
    await b.waitFor("message", (m) => m.content === "from the lobby");
    expect(a.events.find(([e]) => e === "dmLocked")).to.equal(undefined);
  });

  it("locks reading and sending once the ranked game is in progress", async function () {
    await redis.setGameStatus("gRank", "In Progress");
    a.clear(); b.clear();
    await a.say("should not arrive");
    const locked = await a.waitFor("dmLocked");
    expect(locked.gameId).to.equal("gRank");
    expect(locked.message).to.match(/ranked or competitive/);

    a.send("getChannel", channelId);
    await a.waitFor("dmLocked", () => true);
    expect(a.events.find(([e]) => e === "channel")).to.equal(undefined);

    a2.clear();
    await b.say("while you play");
    await b.waitFor("message", (m) => m.content === "while you play");
    await sleep(300);
    expect(a2.events.find(([e, m]) => e === "message")).to.equal(undefined);
    expect(b.events.find(([e, m]) => e === "message" && m.content === "should not arrive")).to.equal(undefined);

    a.send("newDMChannel", ["dmC"]);
    await a.waitFor("dmLocked", () => true);
  });

  it("unlocks when the player dies", async function () {
    await redis.setPlayerDead("gRank", "dmA", true);
    a.clear();
    a.send("getChannel", channelId);
    const ch = await a.waitFor("channel");
    expect(ch.messages.map((m) => m.content)).to.include("while you play");
    await a.say("dead and chatting");
    await b.waitFor("message", (m) => m.content === "dead and chatting");
  });

  it("unlocks after leaving the game", async function () {
    await redis.setPlayerDead("gRank", "dmA", false);
    a.clear();
    await a.say("x");
    await a.waitFor("dmLocked");
    await redis.leaveGame("dmA");
    a.clear();
    a.send("getChannel", channelId);
    await a.waitFor("channel");
    await a.say("left the game");
    await b.waitFor("message", (m) => m.content === "left the game");
  });

  it("marks a channel read in the user's other windows", async function () {
    a2.clear();
    a.send("readNotifsInChannel", channelId);
    expect(await a2.waitFor("notifsRead")).to.equal(channelId);
    for (const s of [a, a2, b]) s.close();
  });
});
