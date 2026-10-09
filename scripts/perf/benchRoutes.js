/**
 * Perf harness: sequential latency for common API routes against a local
 * stack seeded by scripts/perf/seed.js.
 *   BASE=http://localhost:3200 node scripts/perf/benchRoutes.js [n=30]
 */
const fs = require("fs");
const BASE = process.env.BASE || "http://localhost:3200";
const N = Number(process.argv[2] || 30);
const cookies = JSON.parse(fs.readFileSync("/tmp/umperf-cookies.json"));
const cookie = cookies[0];

async function first(path) {
  const r = await fetch(BASE + path, { headers: { cookie } });
  return r.json();
}

(async () => {
  const setups = await first("/api/game/list?list=all");
  const routes = [
    "/api/user/info",
    "/api/notifs",
    "/api/roles/all",
    "/api/roles/modifiers",
    "/api/game/list?list=all",
    "/api/game/openCounts",
    "/api/user/perf1/profile",
    "/api/user/perf1/games?page=1",
    "/api/user/perf1/games?page=20",
    ...(process.env.LIGHT_USER ? [`/api/user/${process.env.LIGHT_USER}/profile`, `/api/user/${process.env.LIGHT_USER}/games?page=1`] : []),
    ...(process.env.SETUP_ID ? [`/api/setup/${process.env.SETUP_ID}`] : []),
    "/api/user/leaderboard",
    "/api/game/mostPlayedRecently?daysInterval=7",
    "/api/hall-of-fame",
  ];
  const rows = [];
  for (const path of routes) {
    const ts = [];
    let bytes = 0, status = 0;
    for (let i = 0; i < N; i++) {
      const t = performance.now();
      const r = await fetch(BASE + path, { headers: { cookie, "accept-encoding": "identity" } });
      const b = await r.arrayBuffer();
      ts.push(performance.now() - t);
      bytes = b.byteLength;
      status = r.status;
    }
    ts.sort((a, b) => a - b);
    rows.push({ path, status, p50: +ts[Math.floor(N / 2)].toFixed(1), p95: +ts[Math.floor(N * 0.95)].toFixed(1), KB: +(bytes / 1024).toFixed(1) });
  }
  console.table(rows);
})();
