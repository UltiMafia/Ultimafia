// Secret Dictator bot driver for Developer API test accounts.
//   node sddriver.js <gameId>   (drives every test account of this developer in that game)
const fs = require("fs");
const { BASE, api, getToken, getTokenValue } = require("./common");
const gameId = process.argv[2];
const LOG = process.env.LOG || `${__dirname}/logs/${gameId}.log`;
fs.mkdirSync(require("path").dirname(LOG), { recursive: true });
const log = (...a) => fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${a.map((x) => (typeof x == "string" ? x : JSON.stringify(x))).join(" ")}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (l) => l[Math.floor(Math.random() * l.length)];

const bots = new Map();
let finished = false;
const LINES = {
  ja: ["Ja!", "sure, let's try it", "fine by me"],
  nein: ["Nein.", "I don't trust that pair", "no thanks"],
  pick: ["I got what I got", "it wasn't my choice", "trust the process"],
};

function fascist(bot) { return /Fascist|Dictator/.test(bot.role || ""); }

function choose(bot, m) {
  const targets = Array.isArray(m.targets) ? m.targets : [];
  switch (m.name) {
    case "Election Vote":
      return Math.random() < (fascist(bot) ? 0.85 : 0.7) ? "Ja!" : "Nein!";
    case "Discard Policy": {
      const unwanted = fascist(bot) ? "Liberal" : "Fascist";
      return targets.includes(unwanted) ? unwanted : targets[0];
    }
    case "Enact Policy":
    case "Enact Policy (No Veto)": {
      const wanted = fascist(bot) ? "Fascist" : "Liberal";
      if (targets.includes("Veto Agenda") && !targets.includes(wanted) && Math.random() < 0.6) return "Veto Agenda";
      return targets.includes(wanted) ? wanted : targets.find((t) => t != "Veto Agenda");
    }
    case "Assent Veto":
      return Math.random() < 0.5 ? "Yes" : "No";
    default: {
      const others = targets.filter((t) => t != bot.playerId && t != "*");
      return others.length ? pick(others) : null;
    }
  }
}

async function send(bot, event, data) {
  for (let i = 0; i < 5; i++) {
    try { return await api("POST", `/dev/accounts/${bot.id}/send`, { event, data }); }
    catch (e) { if (e.status == 429) { await sleep(800); continue; } log("send error", bot.name, event, e.message); return; }
  }
}

async function say(bot, list) {
  const chat = Object.values(bot.meetings).find((x) => x.speech && x.canTalk);
  if (!chat || Math.random() > 0.3) return;
  await send(bot, "speak", { meetingId: chat.id, content: pick(list) });
}

function pendingMeetings(bot) {
  return Object.values(bot.meetings).filter((m) => m.voting && m.amMember && m.canVote && !m.playerHasVoted && !bot.voted.has(m.id));
}

async function act(bot) {
  if (bot.acting || finished) return;
  bot.acting = true;
  try {
    await sleep(rand(1500, 4000));
    for (const m of pendingMeetings(bot)) {
      const selection = choose(bot, m);
      if (selection == null) continue;
      bot.voted.add(m.id);
      log("vote", bot.name, bot.role, m.name, selection);
      await send(bot, "vote", { meetingId: m.id, selection });
      if (m.name == "Election Vote") await say(bot, selection == "Ja!" ? LINES.ja : LINES.nein);
      else if (/Policy/.test(m.name)) await say(bot, LINES.pick);
      await sleep(rand(300, 900));
    }
  } finally {
    bot.acting = false;
    if (pendingMeetings(bot).length) setTimeout(() => act(bot), 2000);
  }
}

function onEntry(e) {
  const bot = bots.get(e.accountId);
  if (!bot) return;
  const { event, data } = e;
  if (event == "self") bot.playerId = data;
  else if (event == "players" && data && bot.playerId && data[bot.playerId]) bot.name = data[bot.playerId].name;
  else if ((event == "reveal" || event == "roleReveal") && data && data.playerId == bot.playerId && data.role) bot.role = data.role;
  else if (event == "history" && data && data.states) {
    for (const st of Object.values(data.states)) if (st.roles && st.roles[bot.playerId]) bot.role = st.roles[bot.playerId];
  } else if (event == "state" && data) {
    if (data.id !== bot.stateId) { bot.stateId = data.id; bot.meetings = {}; }
    if (data.name) log("state", bot.name, data.name, data.extraInfo && data.extraInfo.policyInfo);
  } else if (event == "meeting" && data) { bot.meetings[data.id] = data; act(bot); }
  else if (event == "leftMeeting") delete bot.meetings[data];
  else if (event == "finished") { if (!finished) log("game finished"); finished = true; setTimeout(() => process.exit(0), 5000); }
  else if (event == "message" || event == "alert") {
    const c = data && (data.content || data);
    if (bot === bots.values().next().value && typeof c == "string" && /enacted|chaos|executed|veto|wins|election/i.test(c)) log("msg", c.slice(0, 200));
  }
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
  for (const a of list) bots.set(a.id, { id: a.id, name: a.name || a.id, meetings: {}, voted: new Set(), playerId: a.playerId });
  log("driving", list.map((a) => a.id));
  for (const a of list) {
    const evs = await api("GET", `/dev/accounts/${a.id}/events?since=0`);
    for (const ev of evs.events || evs) onEntry({ ...ev, accountId: a.id, _replay: true });
  }
  stream();
  setInterval(() => { for (const b of bots.values()) if (pendingMeetings(b).length) act(b); }, 10000);
})().catch((e) => { log("fatal", e.message); process.exit(1); });
