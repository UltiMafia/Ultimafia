/**
 * Perf harness: seed a local Mongo with a production-shaped dataset so API
 * routes and indexes can be measured. NEVER point this at a real database.
 *
 *   node scripts/perf/seed.js [users=20000] [games=40000] [historyKB=40]
 *
 * Prints a cookie for a logged-in session as the last line (user "perf0").
 */
require("dotenv").config();
const crypto = require("crypto");
const mongoose = require("mongoose");
const db = require("../../db/db");
const models = require("../../db/models");

const USERS = Number(process.argv[2] || 20000);
const GAMES = Number(process.argv[3] || 40000);
const HIST_KB = Number(process.argv[4] || 40);
const SETUPS = 3000;
const DAY = 86400000;

if (!/umperf|test/.test(process.env.MONGO_DB)) {
  console.error("Refusing to seed: MONGO_DB must be a perf/test database");
  process.exit(1);
}

const rid = (n = 10) => crypto.randomBytes(n).toString("base64url").slice(0, n);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const roleNames = ["Villager", "Cop", "Doctor", "Mafioso", "Godfather", "Vigilante", "Jailer", "Cultist", "Fool", "Hooker", "Watcher", "Tracker"];

function fakeHistory(kb) {
  const msgs = [];
  let size = 0;
  while (size < kb * 1024) {
    const m = { id: rid(11), senderId: rid(11), content: "I think we should vote " + rid(24), time: Date.now(), textColor: "", nameColor: "" };
    size += JSON.stringify(m).length;
    msgs.push(m);
  }
  return JSON.stringify({ states: { 1: { name: "Day 1", meetings: { x: { messages: msgs } }, alerts: [] } } });
}

(async () => {
  await db.promise;
  const conn = mongoose.connection;
  await conn.db.dropDatabase();
  for (const m of Object.values(models)) await m.init().catch(() => {});

  const now = Date.now();
  console.time("users");
  const userIds = [];
  const userOids = [];
  for (let b = 0; b < USERS; b += 1000) {
    const docs = [];
    for (let i = b; i < Math.min(USERS, b + 1000); i++) {
      const _id = new mongoose.Types.ObjectId();
      const id = i < 50 ? `perf${i}` : rid(10);
      userIds.push(id);
      userOids.push(_id);
      docs.push({
        _id, id, name: `user_${i}`, deleted: false, joined: now - Math.random() * 900 * DAY,
        lastActive: now - Math.random() * 60 * DAY, games: [], setups: [], globalNotifs: [],
        settings: {}, permissions: [], blockedUsers: [], coins: 100, redHearts: 10, goldHearts: 0,
        stats: {}, skillRating: { mu: 25 + Math.random() * 10, sigma: 5 }, kudos: 0, karma: 0,
        email: [`u${i}@gmail.com`], ip: [`10.0.${i % 255}.${i % 200}`],
      });
    }
    await conn.collection("users").insertMany(docs, { ordered: false });
  }
  console.timeEnd("users");

  console.time("setups");
  const setupOids = [];
  const setupDocs = [];
  for (let i = 0; i < SETUPS; i++) {
    const _id = new mongoose.Types.ObjectId();
    setupOids.push(_id);
    const total = 5 + (i % 12);
    const roles = {};
    for (let r = 0; r < total; r++) roles[pick(roleNames) + ":"] = (roles[pick(roleNames) + ":"] || 0) + 1;
    setupDocs.push({ _id, id: rid(9), name: `Setup ${i}`, gameType: "Mafia", creator: pick(userOids), roles: JSON.stringify([roles]), total, count: { Village: total - 2, Mafia: 2 }, played: Math.floor(Math.random() * 5000), featured: i < 20, ranked: i < 200, updatedAt: now, version: 1 });
  }
  await conn.collection("setups").insertMany(setupDocs);
  console.timeEnd("setups");

  console.time("games");
  const hist = fakeHistory(HIST_KB);
  const userGames = new Map();
  // Activity is skewed: 10% of users play 70% of the games.
  const heavy = Math.max(1, Math.floor(USERS * 0.1));
  const pickUser = () => (Math.random() < 0.7 ? Math.floor(Math.random() * heavy) : Math.floor(Math.random() * USERS));
  for (let b = 0; b < GAMES; b += 500) {
    const docs = [];
    for (let i = b; i < Math.min(GAMES, b + 500); i++) {
      const n = 7 + (i % 10);
      const idx = new Set([i % 50]);
      while (idx.size < n) idx.add(pickUser());
      const us = [...idx];
      const _id = new mongoose.Types.ObjectId();
      for (const u of us) (userGames.get(u) || userGames.set(u, []).get(u)).push(_id);
      const end = now - (GAMES - i) * ((30 * DAY) / GAMES);
      const players = us.map(() => rid(11));
      docs.push({
        _id, id: rid(9), type: "Mafia", lobby: pick(["Main", "Main", "Sandbox", "Competitive"]), setup: pick(setupOids.slice(0, 600)),
        users: us.map((u) => userOids[u]), players, names: us.map((u) => `user_${u}`), left: [], winners: players.slice(0, 3),
        winnersInfo: { players: players.slice(0, 3), groups: ["Village"] }, history: hist, startTime: end - 20 * 60000, endTime: end,
        ranked: i % 4 === 0, competitive: false, private: false, playerRoleMap: "{}", playerAlignmentMap: "{}", playerIdMap: "{}",
      });
    }
    await conn.collection("games").insertMany(docs, { ordered: false });
  }
  console.timeEnd("games");

  console.time("user.games");
  const ops = [];
  for (const [u, g] of userGames) ops.push({ updateOne: { filter: { _id: userOids[u] }, update: { $set: { games: g } } } });
  for (let i = 0; i < ops.length; i += 1000) await conn.collection("users").bulkWrite(ops.slice(i, i + 1000));
  console.timeEnd("user.games");

  console.time("notifications");
  const gn = [];
  for (let i = 0; i < 40; i++) gn.push({ _id: new mongoose.Types.ObjectId(), id: rid(10), global: true, isChat: false, content: `Site announcement ${i}`, date: now - i * DAY, read: false });
  await conn.collection("notifications").insertMany(gn);
  await conn.collection("users").updateMany({}, { $set: { globalNotifs: gn.map((x) => x._id) } });
  for (let b = 0; b < 300000; b += 5000) {
    const docs = [];
    for (let i = b; i < b + 5000; i++) docs.push({ id: rid(10), user: userIds[i % 2 === 0 ? i % 50 : Math.floor(Math.random() * USERS)], isChat: i % 3 === 0, global: false, content: "x replied to your thread", date: now - Math.random() * 90 * DAY, read: Math.random() < 0.9 });
    await conn.collection("notifications").insertMany(docs, { ordered: false });
  }
  console.timeEnd("notifications");

  console.time("sessions");
  const secret = process.env.SESSION_SECRET;
  const cookies = [];
  for (let i = 0; i < 50; i++) {
    const sid = rid(32);
    await conn.collection("sessions").insertOne({
      _id: sid, expires: new Date(now + 14 * DAY),
      session: { cookie: { originalMaxAge: 14 * DAY, expires: new Date(now + 14 * DAY), httpOnly: true, path: "/" }, user: { id: userIds[i], _id: userOids[i], csrf: 1 } },
    });
    const sig = crypto.createHmac("sha256", secret).update(sid).digest("base64").replace(/=+$/, "");
    cookies.push("connect.sid=" + encodeURIComponent(`s:${sid}.${sig}`));
  }
  require("fs").writeFileSync("/tmp/umperf-cookies.json", JSON.stringify(cookies));
  console.timeEnd("sessions");
  const st = await conn.db.stats();
  console.log({ dataMB: Math.round(st.dataSize / 1e6), storageMB: Math.round(st.storageSize / 1e6), indexMB: Math.round(st.indexSize / 1e6) });
  console.log(cookies[0]);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
