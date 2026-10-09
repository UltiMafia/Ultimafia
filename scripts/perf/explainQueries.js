/**
 * Perf harness: explain() the hot queries behind profile, game history,
 * notifications, setup page and lobby stats, against the seeded perf DB.
 *   node scripts/perf/explainQueries.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const db = require("../../db/db");

(async () => {
  await db.promise;
  const c = (n) => mongoose.connection.collection(n);
  const user = await c("users").findOne({ id: "perf1" });
  const light = await c("users").findOne({ id: { $not: /^perf/ }, "games.2": { $exists: true }, "games.12": { $exists: false } });
  const setup = (await c("games").findOne({}, { projection: { setup: 1 } })).setup;
  const now = Date.now();
  const qs = {
    "games by user (profile count)": () => c("games").find({ users: user._id }).explain("executionStats"),
    "games by user sorted (history page)": () => c("games").find({ users: user._id }).sort({ endTime: -1 }).skip(0).limit(10).explain("executionStats"),
    "games by light user sorted (history page)": () => c("games").find({ users: light._id }).sort({ endTime: -1 }).limit(10).explain("executionStats"),
    "games by setup (setup page playedCount)": () => c("games").find({ setup, endTime: { $gt: 0 }, hadVeg: { $ne: true } }).explain("executionStats"),
    "games since 7d (mostPlayedRecently/site activity)": () => c("games").find({ startTime: { $gte: now - 7 * 864e5 } }).explain("executionStats"),
    "unread notifs (polled every 10s)": () => c("notifications").find({ user: "perf0", isChat: false, read: false }).explain("executionStats"),
  };
  const rows = [];
  for (const [name, q] of Object.entries(qs)) {
    const e = await q();
    const s = e.executionStats;
    const stage = JSON.stringify(e.queryPlanner.winningPlan).match(/"stage":"(COLLSCAN|IXSCAN)"/g)?.join(",");
    rows.push({ query: name, plan: stage, ms: s.executionTimeMillis, returned: s.nReturned, docsExamined: s.totalDocsExamined, keysExamined: s.totalKeysExamined });
  }
  console.table(rows);
  process.exit(0);
})();
