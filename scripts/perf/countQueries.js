/**
 * Perf harness: count Mongo operations (and their server-side ms) issued by
 * one request to each route, using the database profiler. Local perf DB only.
 *   node scripts/perf/countQueries.js /api/user/perf1/profile ...
 */
require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const BASE = process.env.BASE || "http://localhost:3200";
const cookie = JSON.parse(fs.readFileSync("/tmp/umperf-cookies.json"))[0];

(async () => {
  await mongoose.connect(`mongodb://${process.env.MONGO_URL}/${process.env.MONGO_DB}`);
  const d = mongoose.connection.db;
  const rows = [];
  for (const path of process.argv.slice(2)) {
    await fetch(BASE + path, { headers: { cookie } }); // warm
    await d.command({ profile: 0 });
    await d.collection("system.profile").drop().catch(() => {});
    await d.command({ profile: 2 });
    const t = performance.now();
    await (await fetch(BASE + path, { headers: { cookie } })).arrayBuffer();
    const wall = performance.now() - t;
    await d.command({ profile: 0 });
    const ops = await d.collection("system.profile").find({ ns: { $not: /system\.profile/ } }).toArray();
    const byColl = {};
    for (const o of ops) byColl[o.ns.split(".")[1]] = (byColl[o.ns.split(".")[1]] || 0) + 1;
    rows.push({ path, wallMs: Math.round(wall), mongoOps: ops.length, mongoMs: ops.reduce((a, o) => a + (o.millis || 0), 0), docsExamined: ops.reduce((a, o) => a + (o.docsExamined || 0), 0), byColl: JSON.stringify(byColl) });
  }
  console.table(rows);
  process.exit(0);
})();
