// Liar's Dice bot driver for Developer API test accounts.
//   node driver.js <gameId>   (drives every test account of this developer in that game)
const fs = require("fs");
const { BASE, api, getToken, getTokenValue } = require("./common");
const gameId = process.argv[2];
const LOG = process.env.LOG || `${__dirname}/logs/${gameId}.log`;
fs.mkdirSync(require("path").dirname(LOG), { recursive: true });
const log = (...a) => fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${a.map((x) => (typeof x == "string" ? x : JSON.stringify(x))).join(" ")}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

const bots = new Map(); // accountId -> state
// Each bot keeps its own extraInfo: the server sends each player only their own dice.
let settings = { wildOnes: true, spotOn: true };
let finished = false;
const LINES = {
  bid: ["hmm", "I'll go higher", "feeling lucky", "trust me", "easy", "let's see", "arr"],
  lie: ["no way", "LIAR!", "I don't believe that", "nope", "prove it"],
  spot: ["spot on, I can feel it", "exactly that many!"],
};

function binomTail(n, p, k) { // P(X >= k)
  if (k <= 0) return 1; if (k > n) return 0;
  let s = 0, c = 1;
  for (let i = 0; i <= n; i++) { if (i > 0) c = (c * (n - i + 1)) / i; if (i >= k) s += c * p ** i * (1 - p) ** (n - i); }
  return s;
}
function binomEq(n, p, k) { if (k < 0 || k > n) return 0; let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - i + 1)) / i; return c * p ** k * (1 - p) ** (n - k); }

function myDice(bot) {
  const extra = bot.extra;
  const me = (extra.randomizedPlayers || []).find((p) => p.playerId == bot.playerId);
  return (me && me.rolledDice) || [];
}
function isMyTurn(bot) {
  const extra = bot.extra;
  const me = (extra.randomizedPlayers || []).find((p) => p.playerId == bot.playerId);
  return !!me && extra.whoseTurnIsIt == me.userId;
}
function countMine(dice, face) { return dice.filter((d) => d == face || (settings.wildOnes && face != 1 && d == 1)).length; }

function decide(bot) {
  const extra = bot.extra;
  const dice = myDice(bot);
  const bi = extra.bidInfo || {};
  const N = Number(bi.allDice) || dice.length;
  const others = Math.max(0, N - dice.length);
  const p = (f) => (settings.wildOnes && f != 1 ? 1 / 3 : 1 / 6);
  const lastA = bi.lastBidder ? Number(bi.lastAmountBid) || 0 : 0, lastF = bi.lastBidder ? Number(bi.lastFaceBid) || 1 : 1;
  const probTrue = (a, f) => binomTail(others, p(f), a - countMine(dice, f));
  const hasBid = lastA > 0;
  const m = Object.values(bot.meetings);
  const can = (n) => m.find((x) => x.name == n);
  if (hasBid) {
    const pt = probTrue(lastA, lastF);
    const pe = binomEq(others, p(lastF), lastA - countMine(dice, lastF));
    if (can("SpotOn") && pe > 0.3 && pt < 0.6 && Math.random() < 0.5) return { type: "spot", pt, pe };
    if (can("CallLie") && pt < 0.3) return { type: "lie", pt };
  }
  // candidate raises
  const cands = [];
  for (let a = Math.max(1, lastA); a <= Math.max(1, lastA) + 3 && a <= N; a++)
    for (let f = 1; f <= 6; f++) {
      if (hasBid && (a < lastA || (a == lastA && f <= lastF))) continue;
      if (!hasBid && a == lastA && f <= lastF && lastA > 0) continue;
      const pr = probTrue(a, f);
      cands.push({ a, f, pr, score: pr + (countMine(dice, f) > 0 ? 0.05 : 0) - (f == 1 && settings.wildOnes ? 0.1 : 0) + Math.random() * 0.08 });
    }
  cands.sort((x, y) => y.score - x.score);
  const best = cands[0];
  if (hasBid && can("CallLie") && (!best || best.pr < 0.4) && probTrue(lastA, lastF) < 0.55) return { type: "lie", pt: probTrue(lastA, lastF) };
  if (!best) return can("CallLie") ? { type: "lie" } : null;
  // first bid: be modest
  if (!hasBid) {
    const f = [2, 3, 4, 5, 6].sort((x, y) => countMine(dice, y) - countMine(dice, x) || Math.random() - 0.5)[0];
    const a = Math.max(1, Math.floor(countMine(dice, f) + others * p(f) * 0.7));
    return { type: "bid", a, f, pr: probTrue(a, f) };
  }
  return { type: "bid", a: best.a, f: best.f, pr: best.pr };
}

async function send(bot, event, data) {
  for (let i = 0; i < 5; i++) {
    try { return await api("POST", `/dev/accounts/${bot.id}/send`, { event, data }); }
    catch (e) { if (e.status == 429) { await sleep(800); continue; } log("send error", bot.name, event, e.message); return; }
  }
}
async function say(bot, list) {
  const chat = Object.values(bot.meetings).find((x) => x.speech && x.canTalk);
  if (!chat || Math.random() > 0.35) return;
  await send(bot, "speak", { meetingId: chat.id, content: list[Math.floor(Math.random() * list.length)] });
}

async function act(bot) {
  if (bot.acting || finished) return;
  bot.acting = true;
  try {
    await sleep(rand(1200, 3000));
    const amount = Object.values(bot.meetings).find((x) => x.name == "Amount");
    const face = Object.values(bot.meetings).find((x) => x.name == "Face");
    if (!amount || !face || !isMyTurn(bot)) return;
    const d = decide(bot);
    const extra = bot.extra;
    log("turn", bot.name, { dice: myDice(bot), bid: extra.bidInfo && [extra.bidInfo.allDice, extra.bidInfo.lastAmountBid, extra.bidInfo.lastFaceBid, extra.bidInfo.lastBidder], decision: d });
    if (!d) return;
    if (d.type == "lie") { await send(bot, "vote", { meetingId: Object.values(bot.meetings).find((x) => x.name == "CallLie").id, selection: "Yes!" }); await say(bot, LINES.lie); }
    else if (d.type == "spot") { await send(bot, "vote", { meetingId: Object.values(bot.meetings).find((x) => x.name == "SpotOn").id, selection: "Yes!" }); await say(bot, LINES.spot); }
    else {
      await send(bot, "vote", { meetingId: face.id, selection: `dice${d.f}` });
      await sleep(rand(400, 900));
      await send(bot, "vote", { meetingId: amount.id, selection: String(d.a) });
      await say(bot, LINES.bid);
    }
  } finally {
    bot.acting = false;
    // if still our turn (e.g. rejected bid), retry once more later
    setTimeout(() => { if (isMyTurn(bot) && Object.values(bot.meetings).some((x) => x.name == "Amount")) act(bot); }, 4000);
  }
}

function onEntry(e) {
  const bot = bots.get(e.accountId);
  if (!bot) return;
  const { event, data } = e;
  if (event == "self") bot.playerId = data;
  else if (event == "players" && data && bot.playerId && data[bot.playerId]) bot.name = data[bot.playerId].name;
  else if (event == "meeting" && data) {
    // A new meeting of the same name replaces older ones (old turns are not always "left").
    for (const [id, m] of Object.entries(bot.meetings)) if (m.name == data.name && id != data.id) delete bot.meetings[id];
    bot.meetings[data.id] = data; if (data.name == "Amount") act(bot); }
  else if (event == "leftMeeting") delete bot.meetings[data];
  else if (event == "state" && data) { if (data.extraInfo) { bot.extra = data.extraInfo; if (isMyTurn(bot) && Object.values(bot.meetings).some((x) => x.name == "Amount")) act(bot); } if (data.name) log("state", bot.name, data.name); }
  else if (event == "history" && data && data.states) { const st = Object.values(data.states).pop(); if (st && st.extraInfo) bot.extra = st.extraInfo; }
  else if (event == "options" && data) settings = { ...settings, ...(data.gameTypeOptions ? (typeof data.gameTypeOptions == "string" ? JSON.parse(data.gameTypeOptions) : data.gameTypeOptions) : {}), ...data };
  else if (event == "finished") { if (!finished) log("game finished"); finished = true; setTimeout(() => process.exit(0), 5000); }
  else if (event == "alert" || event == "message") { const c = data && (data.content || data); if (bot === bots.values().next().value && typeof c == "string" && /lie|SPOT|loses|wins|won/i.test(c)) log("msg", c.slice(0, 200));
    if (typeof c == "string" && / wins!/.test(c) && !finished) { finished = true; log("game over:", c); setTimeout(() => process.exit(0), 10000); } }
}

async function stream() {
  while (!finished) {
    try {
      await getToken();
      const res = await fetch(`${BASE}/api/dev/stream`, { headers: { authorization: `Bearer ${getTokenValue()}` } });
      log("stream connected", res.status);
      const dec = new TextDecoder(); let buf = "";
      for await (const chunk of res.body) {
        buf += dec.decode(chunk, { stream: true });
        let end;
        while ((end = buf.indexOf("\n\n")) != -1) {
          const block = buf.slice(0, end); buf = buf.slice(end + 2);
          const line = block.split("\n").find((l) => l.startsWith("data: "));
          if (line && block.startsWith("event: game")) { try { onEntry(JSON.parse(line.slice(6))); } catch (err) { log("entry error", err.message); } }
        }
      }
    } catch (err) { log("stream error", err.message); }
    await sleep(2000);
  }
}

(async () => {
  const all = await api("GET", "/dev/accounts");
  const list = (all.accounts || all).filter((a) => a.gameId == gameId && a.status != "left" && a.status != "dropped");
  for (const a of list) bots.set(a.id, { id: a.id, name: a.name || a.id, meetings: {}, playerId: a.playerId, extra: {} });
  log("driving", list.map((a) => a.id));
  // Catch up on events already received (meetings, self, state)
  for (const a of list) {
    const evs = await api("GET", `/dev/accounts/${a.id}/events?since=0`);
    for (const ev of evs.events || evs) onEntry({ ...ev, accountId: a.id, _replay: true });
  }
  stream();
  // Safety poll: act if it's someone's turn and no stream event arrived
  setInterval(() => { for (const b of bots.values()) if (isMyTurn(b) && Object.values(b.meetings).some((x) => x.name == "Amount")) act(b); }, 15000);
})().catch((e) => { log("fatal", e.message); process.exit(1); });
