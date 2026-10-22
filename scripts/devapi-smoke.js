/*
 * End-to-end check of the developer API against a running site.
 *
 *   BASE_URL=https://your-dev-site CLIENT_ID=... CLIENT_SECRET=... SETUP_ID=... \
 *     node scripts/devapi-smoke.js
 *
 * Hosts a Testing-lobby Mafia game, fills it with test accounts, forces one
 * Mafioso, speeds timers up, plays it to the end through the API, then has
 * every account leave and reads the saved review.
 */

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const { CLIENT_ID, CLIENT_SECRET, SETUP_ID } = process.env;
const TIMER_SCALE = Number(process.env.TIMER_SCALE || 0.05);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 6 * 60 * 1000);

let token;
const started = Date.now();
const log = (step, value) =>
  console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s] ${step}`, value === undefined ? "" : JSON.stringify(value));

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return data;
}

function streamEvents(onEntry) {
  const controller = new AbortController();
  (async () => {
    const res = await fetch(`${BASE_URL}/api/dev/stream`, {
      headers: { authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n\n")) != -1) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const line = block.split("\n").find((l) => l.startsWith("data: "));
        if (line) onEntry(JSON.parse(line.slice(6)));
      }
    }
  })().catch((e) => {
    if (e.name != "AbortError") log("stream error", e.message);
  });
  return () => controller.abort();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(check, what) {
  while (!check()) {
    if (Date.now() - started > TIMEOUT_MS) throw new Error(`Timed out waiting for ${what}`);
    await sleep(200);
  }
}

async function main() {
  token = (await api("POST", "/dev/token", { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })).token;
  log("token", { ok: Boolean(token) });
  log("me", await api("GET", "/dev/me"));

  const setup = await api("GET", `/setup/${SETUP_ID}`);
  log("setup", { id: setup.id, name: setup.name, total: setup.total, roles: setup.roles });

  const gameId = await api("POST", "/game/host", {
    gameType: "Mafia",
    setup: SETUP_ID,
    lobby: "Testing",
    lobbyName: "devapi smoke",
    private: true,
    spectating: true,
    stateLengths: { Day: 10, Night: 2 },
    extendLength: 1,
    pregameWaitLength: 1,
  });
  log("hosted Testing game", gameId);

  const accounts = new Map();
  const seqGaps = [];
  const stateLog = [];
  let finished = false;
  let winners;

  const stopStream = streamEvents((entry) => {
    let acct = accounts.get(entry.accountId);
    if (!acct) {
      acct = { meetings: {}, lastSeq: 0 };
      accounts.set(entry.accountId, acct);
    }
    if (entry.seq != null) {
      if (acct.lastSeq && entry.seq != acct.lastSeq + 1) seqGaps.push([entry.accountId, acct.lastSeq, entry.seq]);
      acct.lastSeq = entry.seq;
    }
    if (entry.event == "self") acct.playerId = entry.data;
    if (entry.event == "meeting") acct.meetings[entry.data.id] = entry.data;
    if (entry.event == "leftMeeting") delete acct.meetings[entry.data];
    if (entry.event == "state" && entry.data && entry.data.name) {
      if (stateLog[stateLog.length - 1] != entry.data.name) {
        stateLog.push(entry.data.name);
        log("state", entry.data.name);
      }
      acct.voted = {};
    }
    if (entry.event == "winners") {
      finished = true;
      winners = entry.data;
    }
  });
  await sleep(300);

  const spawnOne = async () => {
    const [created] = await api("POST", "/dev/accounts", { gameId, count: 1 });
    if (created.status != "joined") throw new Error(`Account failed to join: ${created.error}`);
    if (!accounts.has(created.id)) accounts.set(created.id, { meetings: {}, lastSeq: 0 });
    accounts.get(created.id).id = created.id;
    return created;
  };

  const first = [];
  for (let i = 0; i < setup.total - 1; i++) first.push(await spawnOne());
  log("spawned", first.map((a) => ({ id: a.id, status: a.status })));
  await api("POST", "/game/leave");
  log("developer left the lobby seat list; still the controlling host");
  await waitFor(() => first.every((a) => accounts.get(a.id).playerId), "player ids");

  const mafiosoAccount = first[0].id;
  const mafiosoPlayer = accounts.get(mafiosoAccount).playerId;
  const control = (command, args) => api("POST", `/dev/games/${gameId}/control`, { command, args });
  log("control seed", (await control("seed", { seed: "smoke-1" })).seed);
  log("control forceRoles", (await control("forceRoles", { roles: { [mafiosoPlayer]: "Mafioso" } })).forcedRoles);
  log("control timerScale", (await control("timerScale", { scale: TIMER_SCALE })).timerScale);

  const last = await spawnOne();
  log("spawned last seat, game should start", { id: last.id });

  await waitFor(() => stateLog.length > 0 && stateLog[stateLog.length - 1] != "Pregame", "game start");
  const snapshot = await control("state");
  log("roles after start", snapshot.players.map((p) => ({ id: p.id, name: p.name, role: p.role })));
  const mafiaPlayer = snapshot.players.find((p) => p.role == "Mafioso");
  if (!mafiaPlayer || mafiaPlayer.id != mafiosoPlayer) throw new Error("forceRoles did not place the Mafioso");

  const speaker = [...accounts.values()].find((a) => a.id && a.playerId != mafiosoPlayer);
  let advancedOnce = false;
  let spoke = false;

  while (!finished) {
    if (Date.now() - started > TIMEOUT_MS) throw new Error("Timed out playing the game");
    const state = stateLog[stateLog.length - 1];

    if (state && state.startsWith("Night") && !advancedOnce) {
      advancedOnce = true;
      log("control advance (skip the first night)", (await control("advance")).state);
      continue;
    }

    for (const acct of accounts.values()) {
      if (!acct.id) continue;
      for (const meeting of Object.values(acct.meetings)) {
        if (!meeting.voting || !meeting.canVote || !meeting.amMember) continue;
        acct.voted = acct.voted || {};
        if (acct.voted[meeting.id]) continue;
        const targets = (meeting.targets || []).filter((t) => t != acct.playerId && t != "*");
        if (targets.length == 0) continue;
        const selection =
          meeting.name == "Village" && acct.playerId != mafiosoPlayer && targets.includes(mafiosoPlayer)
            ? mafiosoPlayer
            : targets[0];
        acct.voted[meeting.id] = true;
        if (meeting.name == "Village" && !spoke && acct == speaker) {
          spoke = true;
          await api("POST", `/dev/accounts/${acct.id}/send`, {
            event: "speak",
            data: { meetingId: meeting.id, content: "devapi smoke: voting the Mafioso" },
          });
          log("say", { account: acct.id, meeting: meeting.name });
        }
        await api("POST", `/dev/accounts/${acct.id}/send`, {
          event: "vote",
          data: { meetingId: meeting.id, selection },
        });
        log("vote", { account: acct.id, meeting: meeting.name, selection });
      }
    }
    await sleep(300);
  }

  log("game over", winners);
  for (const acct of accounts.values())
    if (acct.id) log("leave", (await api("POST", `/dev/accounts/${acct.id}/leave`)).status);

  let review;
  for (let i = 0; i < 40 && !review; i++) {
    await sleep(500);
    review = await api("GET", `/game/${gameId}/review/data`).catch(() => null);
  }
  if (!review) throw new Error("Review was not saved");
  log("review saved", {
    id: review.id,
    lobby: review.lobby,
    private: review.private,
    players: review.players && review.players.length,
    winners: review.winnersInfo,
  });

  const allList = await api("GET", "/game/list?list=finished&lobby=All");
  log("hidden from All", !allList.some((g) => g.id == gameId));
  const testingList = await api("GET", "/game/list?list=finished&lobby=Testing");
  log("listed in Testing for developers", testingList.some((g) => g.id == gameId));
  log("states seen", stateLog);
  log("seq gaps across all accounts", seqGaps.length);

  stopStream();
  log("PASS");
}

main().catch((e) => {
  log("FAIL", e.message);
  process.exit(1);
}).then(() => process.exit(0));
