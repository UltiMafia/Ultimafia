/*
 * Checks the developer API extras against a running site: JSON errors,
 * parallel Testing games, pause/step/resume, jumpTo, burst and send limits.
 *
 *   BASE_URL=... CLIENT_ID=... CLIENT_SECRET=... SETUP_ID=<4-player Mafia setup> \
 *     node scripts/devapi-controls-check.js
 */

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const { CLIENT_ID, CLIENT_SECRET, SETUP_ID } = process.env;
const started = Date.now();
let token;
const log = (step, value) =>
  console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s] ${step}`, value === undefined ? "" : JSON.stringify(value));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, body, auth = true) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(auth && token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {}
  return { status: res.status, data };
}

async function api(method, path, body) {
  const { status, data } = await call(method, path, body);
  if (status >= 400) throw new Error(`${method} ${path} -> ${status} ${JSON.stringify(data)}`);
  return data;
}

const control = (gameId, command, args) => api("POST", `/dev/games/${gameId}/control`, { command, args });

async function hostWithAccounts(count) {
  const gameId = await api("POST", "/game/host", {
    gameType: "Mafia",
    setup: SETUP_ID,
    lobby: "Testing",
    private: true,
    stateLengths: { Day: 10, Night: 2 },
    extendLength: 1,
    pregameWaitLength: 1,
  });
  const accounts = await api("POST", "/dev/accounts", { gameId, count });
  await api("POST", "/game/leave");
  return { gameId, accounts };
}

async function waitForState(gameId, name, timeoutMs = 30000) {
  const until = Date.now() + timeoutMs;
  let state;
  while (Date.now() < until) {
    state = await control(gameId, "state");
    if (state.state == name) return state;
    await sleep(250);
  }
  throw new Error(`${gameId} never reached ${name}; last ${state && state.state}`);
}

async function main() {
  log("401 without auth", await call("GET", "/dev/accounts", undefined, false));
  token = (await api("POST", "/dev/token", { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })).token;
  log("403 token on a non-API route", await call("POST", "/user/logout"));
  log("403 developer on Owner route", await call("GET", "/dev/owner/keys"));

  const g1 = await hostWithAccounts(3);
  await sleep(Number(process.env.HOST_COOLDOWN_MS || 6500));
  const g2 = await hostWithAccounts(3);
  log("two Testing games hosted in parallel", [g1.gameId, g2.gameId]);

  await sleep(500);
  const burst = await api("POST", "/dev/accounts/burst", {
    accountIds: g2.accounts.map((a) => a.id),
    messages: 10,
    content: "burst",
  });
  log("burst 10 messages x 3 accounts (pregame chat)", burst);
  const echoed = await api("GET", `/dev/accounts/${g2.accounts[0].id}/events`);
  log("burst messages seen by an account", echoed.filter((e) => e.event == "message" && /^burst \d+$/.test(e.data.content)).length);

  const rapid = await Promise.all(
    Array.from({ length: 30 }, () =>
      call("POST", `/dev/accounts/${g2.accounts[1].id}/send`, { event: "typing", data: { meetingId: "x", isTyping: false } })
    )
  );
  const statuses = rapid.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
  log("30 rapid sends -> status counts", statuses);
  log("429 body", rapid.find((r) => r.status == 429)?.data);

  await control(g1.gameId, "timerScale", { scale: 0.05 });
  await api("POST", "/dev/accounts", { gameId: g1.gameId, count: 1 });
  await api("POST", "/dev/accounts", { gameId: g2.gameId, count: 1 });
  await waitForState(g1.gameId, "Night 1");
  await waitForState(g2.gameId, "Night 1");
  log("both games started");

  log("pause g1", (await control(g1.gameId, "pause")).paused);
  await sleep(9000);
  log("g1 after 9s paused (Night is 6s at 0.05x)", (await control(g1.gameId, "state")).state);
  log("step g1", (await control(g1.gameId, "step")).state);
  await sleep(2000);
  log("g1 2s after step, still paused", (await control(g1.gameId, "state")).state);
  log("resume g1", (await control(g1.gameId, "resume")).paused);

  const before = await control(g2.gameId, "state");
  const villager = before.players.find((p) => p.role == "Villager");
  const jumped = await control(g2.gameId, "jumpTo", { state: "Night 2", dead: [villager.id] });
  log("g2 jumpTo Night 2 with one villager dead", {
    state: jumped.state,
    dead: jumped.players.filter((p) => !p.alive).map((p) => `${p.name} (${p.role})`),
    finished: jumped.finished,
  });

  for (const g of [g1, g2]) {
    const state = await control(g.gameId, "state");
    const mafioso = state.players.find((p) => p.role == "Mafioso" && p.alive);
    if (mafioso) await control(g.gameId, "kill", { player: mafioso.id });
    log(`${g.gameId} finished after killing the Mafioso`, (await control(g.gameId, "state")).finished);
  }

  for (const a of await api("GET", "/dev/accounts"))
    if (a.status == "joined") await api("POST", `/dev/accounts/${a.id}/leave`);
  log("PASS");
}

main()
  .catch((e) => {
    log("FAIL", e.message);
    process.exit(1);
  })
  .then(() => process.exit(0));
