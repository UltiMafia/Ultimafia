// End to end: runs modules/chat.js in a child process and drives it over
// real sockets to check what the X Chat style DM window relies on: group DM
// creation and reuse, last-message previews in chatInfo / dateUpdate /
// newDirectChannel, unread notifications for group members, and the error a
// too-fast message gets.
const chai = require("chai"),
  expect = chai.expect;
const path = require("path");
const { spawn } = require("child_process");
const WebSocket = require("ws");
const db = require("../db/db");
const redis = require("../modules/redis");
const models = require("../db/models");
const { stringifyMessage, parseMessage } = require("../lib/sockets");

const PORT = 3990 + Math.floor(Math.random() * 90);
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

describe("Chat server DM previews and group DMs", function () {
  this.timeout(30000);
  let proc;
  const ids = ["pvA", "pvB", "pvC"];

  before(async function () {
    await db.promise;
    await redis.client.flushdbAsync();
    await models.User.deleteMany({ id: { $in: ids } });
    await models.ChatChannel.deleteMany({ memberIds: { $in: ids } });
    await models.ChannelOpen.deleteMany({ user: { $in: ids } });
    await models.Notification.deleteMany({ user: { $in: ids } });
    await models.ChatMessage.deleteMany({ senderId: { $in: ids } });
    for (const id of ids) {
      await models.User.create({
        id, name: "N" + id, deleted: false, joined: Date.now(), avatar: id === "pvB",
        settings: {}, blockedUsers: [],
      });
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
  });

  let a, b, c, groupId;

  it("creates a group DM for the typed people plus me", async function () {
    a = client("pvA"); b = client("pvB"); c = client("pvC");
    await Promise.all([a.ready, b.ready, c.ready]);
    a.send("newDMChannel", ["pvB", "pvC"]);
    const info = await a.waitFor("newDirectChannel");
    expect(info.focus).to.equal(true);
    groupId = info.channel.id;
    expect(groupId).to.have.lengthOf(32);
    expect(info.channel.members.map((m) => m.id).sort()).to.deep.equal(ids);
    const bob = info.channel.members.find((m) => m.id === "pvB");
    expect(bob).to.deep.equal({ id: "pvB", name: "NpvB", avatar: true });
    expect(info.channel.lastMessage).to.equal(null);
  });

  it("delivers the first group message, previews it and notifies the others", async function () {
    a.send("getChannel", groupId);
    await a.waitFor("channel");
    await a.say("hello group");
    await a.waitFor("message", (m) => m.content === "hello group");

    // B and C had not opened it: it appears in their lists with a preview,
    // plus an unread notification.
    for (const s of [b, c]) {
      const nd = await s.waitFor("newDirectChannel", (d) => d.channel.id === groupId);
      expect(nd.focus).to.equal(false);
      expect(nd.channel.lastMessage).to.include({ content: "hello group", senderId: "pvA" });
      for (const m of nd.channel.members)
        expect(Object.keys(m).sort()).to.deep.equal(["avatar", "id", "name"]);
      const notif = await s.waitFor("newNotif", (d) => d.notif.channelId === groupId);
      expect(notif.notif.isChat).to.equal(true);
    }
    // Everyone's list gets the new date and preview.
    for (const s of [a, b, c]) {
      const du = await s.waitFor("dateUpdate", (d) => d.channel === groupId);
      expect(du.lastMessage).to.include({ content: "hello group", senderId: "pvA" });
    }
  });

  it("lists DMs with their last message in chatInfo", async function () {
    const fresh = client("pvC");
    const info = await fresh.ready;
    const d = info.directs.find((x) => x.id === groupId);
    expect(d.lastMessage).to.include({ content: "hello group", senderId: "pvA" });
    expect(d.members.map((m) => m.id).sort()).to.deep.equal(ids);
    expect(info.notifs.filter((n) => n.channelId === groupId)).to.have.lengthOf(1);
    fresh.close();
  });

  it("reuses the channel for the same people in any order", async function () {
    c.clear();
    c.send("newDMChannel", ["pvB", "pvA"]);
    const id = await c.waitFor("openDM");
    expect(id).to.equal(groupId);
  });

  it("all members can send and receive in the group", async function () {
    for (const s of [b, c]) { s.send("getChannel", groupId); await s.waitFor("channel"); }
    a.clear(); b.clear(); c.clear();
    await b.say("bob here");
    await c.say("carl here");
    for (const s of [a, b, c]) {
      await s.waitFor("message", (m) => m.content === "bob here" && m.sender.id === "pvB");
      await s.waitFor("message", (m) => m.content === "carl here" && m.sender.id === "pvC");
    }
  });

  it("tells the sender when a message is refused for being too fast", async function () {
    a.clear();
    await sleep(600);
    a.send("sendMessage", "one");
    // Typed and sent right after the first (the limit is 1 per 500ms).
    await sleep(150);
    a.send("sendMessage", "two");
    expect(await a.waitFor("error")).to.match(/too quickly/);
    await a.waitFor("message", (m) => m.content === "one");
    await sleep(300);
    expect(a.events.find(([e, m]) => e === "message" && m.content === "two")).to.equal(undefined);
  });

  it("sends the sender's custom emotes and stickers with DMs, content untouched", async function () {
    const owner = await models.User.findOne({ id: "pvA" }).select("_id");
    const emote = await models.CustomEmote.create({ id: "ceTest1", name: "pvwave", creator: owner._id, extension: "webp" });
    const sticker = await models.CustomSticker.create({ id: "csTest1", name: "pvsticker", creator: owner._id, extension: "png" });
    await models.User.updateOne({ id: "pvA" }, { $set: { customEmotes: [emote._id], customStickers: [sticker._id] } });
    await redis.deleteUserInfo("pvA");
    try {
      b.clear(); a.clear();
      await sleep(600);
      const text = "hi :pvwave: :happy: :pvsticker:";
      a.send("sendMessage", text);
      const live = await b.waitFor("message", (m) => m.content === text);
      expect(live.content).to.equal(text);
      expect(live.sender.customEmotes[":pvwave:"]).to.include({ name: "pvwave", id: "ceTest1", extension: "webp" });
      expect(live.sender.customEmotes[":pvwave:"].path).to.match(/pvA_customEmote_ceTest1\.webp$/);
      expect(live.sender.customStickers[":pvsticker:"]).to.include({ name: "pvsticker", id: "csTest1" });
      // Only the sender's own: B's messages carry B's (empty) maps.
      await b.say("no emotes here");
      const fromB = await a.waitFor("message", (m) => m.content === "no emotes here");
      expect(fromB.sender.customEmotes).to.deep.equal({});

      // History (getChannel) carries them too.
      c.clear();
      c.send("getChannel", groupId);
      const ch = await c.waitFor("channel");
      const old = ch.messages.find((m) => m.content === text);
      expect(old.sender.customStickers).to.have.property(":pvsticker:");
      expect(old.sender.customEmotes).to.have.property(":pvwave:");
      const stored = await models.ChatMessage.findOne({ channel: groupId, content: text }).select("content");
      expect(stored.content).to.equal(text);
    } finally {
      await models.CustomEmote.deleteOne({ id: "ceTest1" });
      await models.CustomSticker.deleteOne({ id: "csTest1" });
      await models.User.updateOne({ id: "pvA" }, { $set: { customEmotes: [], customStickers: [] } });
      await redis.deleteUserInfo("pvA");
    }
  });

  it("updates previews when the last message is deleted", async function () {
    const last = await models.ChatMessage.findOne({ channel: groupId }).sort({ date: -1 }).select("id content");
    expect(last.content).to.equal("no emotes here");
    a.clear();
    b.send("deleteMessage", last.id);
    const pu = await a.waitFor("previewUpdate", (d) => d.channel === groupId);
    expect(pu.lastMessage).to.include({ content: "hi :pvwave: :happy: :pvsticker:", senderId: "pvA" });
    for (const s of [a, b, c]) s.close();
  });
});
