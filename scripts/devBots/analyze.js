// node analyze.js <gameId> <ld|sd>  -> evidence from the game event log (real socket frames)
const { fetchLog } = require("./gamelog");
const [gameId, kind] = [process.argv[2], process.argv[3] || "ld"];
const chatName = kind == "sd" ? "Government" : "Casino";
(async () => {
  const ev = (await fetchLog(gameId)).filter((x) => x.direction == "out").sort((a, b) => a.t_server_ms - b.t_server_ms || a.seq - b.seq);
  const playerOf = {};
  for (const x of ev) if (x.event == "self") playerOf[x.userId] = x.payload;
  const users = Object.keys(playerOf);
  const size = (x) => Buffer.byteLength(JSON.stringify([x.event, x.payload ?? null]));
  const leaks = [];
  let finished = false, checkedDice = 0;
  function scan(node, viewer, x) {
    if (!node || typeof node != "object") return;
    if (Array.isArray(node)) return node.forEach((n) => scan(n, viewer, x));
    if (node.playerId && Array.isArray(node.rolledDice)) {
      checkedDice++;
      if (node.playerId != viewer && node.rolledDice.some((d) => d != 0)) leaks.push({ to: viewer, owner: node.playerId, event: x.event, t: x.t_server_ms });
    }
    for (const k in node) scan(node[k], viewer, x);
  }
  // actions: bids / calls (LD) or votes resolving (SD), keyed off server alerts to one observer
  const obs = users[0];
  const actions = [];
  const stateIds = new Set();
  let chatMessages = 0;
  let current = null;
  let obsState = null;
  const roundBidsSeen = [];
  for (const x of ev) {
    if (x.event == "state" && x.payload && x.payload.id == -2) finished = true;
    if (kind == "ld" && !finished && (x.event == "state" || x.event == "history")) scan(x.payload, playerOf[x.userId], x);
    if (x.userId == obs && x.event == "state") {
      if (!current) obsState = x.payload.id;
      stateIds.add(x.payload.id);
      const rb = x.payload.extraInfo && x.payload.extraInfo.bidInfo && x.payload.extraInfo.bidInfo.roundBids;
      if (rb) roundBidsSeen.push({ id: x.payload.id, n: rb.length });
    }
    if (x.userId == obs && x.event == "message" && x.payload.senderId != "server" && x.payload.senderId != "vote") chatMessages++;
    const isAction = x.userId == obs && x.event == "message" && x.payload.senderId == "server" &&
      (kind == "ld" ? /( bids \d+x | called a bluff|spot on|Spot On)/i.test(x.payload.content) : /(has been nominated|election has|Voted |is discarding|is enacting|policy has been enacted|initiated a veto|executing|investigating|Special Election|peeking)/.test(x.payload.content));
    if (isAction) {
      if (current) actions.push(current);
      current = { lastState: obsState, label: x.payload.content.slice(0, 60), chatBefore: chatMessages, frames: 0, bytes: 0, newStates: 0, sameStateUpdates: 0, chatMeetingResends: 0, chatMeetingResendBytes: 0 };
      continue;
    }
    if (!current) continue;
    if (x.event == "time" || x.event == "speakCooldown") continue;
    current.frames++; current.bytes += size(x);
    if (x.event == "state") { if (x.userId == obs) { obsState = x.payload.id; if (x.payload.id == current.lastState) current.sameStateUpdates++; else current.newStates++; current.lastState = x.payload.id; } }
    if (x.event == "meeting" && x.payload.name == chatName) { current.chatMeetingResends++; current.chatMeetingResendBytes += size(x); }
    if (x.event == "message" && x.payload.senderId != "server") { current.frames--; current.bytes -= size(x); }
  }
  if (current) actions.push(current);
  const groups = {};
  for (const a of actions) {
    const k = kind == "ld" ? (/ bids /.test(a.label) ? "bid" : "call") : a.label.replace(/[A-Z][a-z]+[A-Z][a-z]+\d+/g, "X").slice(0, 40);
    (groups[k] ||= []).push(a);
  }
  const summary = {};
  for (const [k, l] of Object.entries(groups)) {
    const avg = (f) => +(l.reduce((s, a) => s + a[f], 0) / l.length).toFixed(1);
    summary[k] = { count: l.length, framesAllPlayers: avg("frames"), bytesAllPlayers: Math.round(avg("bytes")), newStatesSeenByObserver: avg("newStates"), chatMeetingResends: avg("chatMeetingResends"), chatResendBytes: Math.round(avg("chatMeetingResendBytes")), chatMessagesAtTime: [Math.min(...l.map((a) => a.chatBefore)), Math.max(...l.map((a) => a.chatBefore))] };
  }
  let resetsOk = true, prev = null;
  for (const r of roundBidsSeen) { if (prev && r.id != prev.id && r.n != 0) resetsOk = false; prev = r; }
  console.log(JSON.stringify({ gameId, kind, players: users.length, frames: ev.length, chatMessages, distinctStates: stateIds.size, finished, diceObjectsChecked: checkedDice, diceLeaks: leaks.length, roundBidLogResetsEachRound: kind == "ld" ? resetsOk : undefined, maxRoundBids: Math.max(0, ...roundBidsSeen.map((r) => r.n)), byAction: summary }, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
