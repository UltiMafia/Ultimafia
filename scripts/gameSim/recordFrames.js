// Records the socket frames one player receives while bots play Liar's Dice or
// Secret Dictator in a lobby with a long chat, and prints frames and bytes per
// game action for all players. Run from the repository root:
//   node scripts/gameSim/recordFrames.js <ld|sd> <chatMessages> <actions> <out.json>
// Replay the output in the browser-free chat bench (react_main/perf/runPhaseBench.js).
const path = require("path");
const root = process.cwd();
const db = require(path.join(root, "db/db"));
require(path.join(root, "modules/redis"));
const { makeGame, waitFor, seedChat } = require(path.join(root, "scripts/gameSim/harness"));
const [kind, nArg, kArg, out] = process.argv.slice(2);
const N = Number(nArg), K = Number(kArg);
let seed = 7;
const rng = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
Math.random = rng;
const tick = () => new Promise((r) => setTimeout(r, 15));
(async () => {
  await db.promise;
  let made, chatName, act;
  if (kind == "ld") {
    const bot = require(path.join(root, "scripts/gameSim/liarsDiceBot"));
    made = await makeGame(require(path.join(root, "Games/types/LiarsDice/Game")), { players: 6, setup: { total: 6, roles: [{ "Liar:": 6 }] }, settings: { stateLengths: { "Guess Dice": 600000 }, startingDice: 5, wildOnes: true, spotOn: true } });
    await waitFor(() => made.game.started && made.game.getStateName() == "Guess Dice");
    chatName = "Casino";
    act = async () => { const g = made.game; bot.act(g, { amount: (parseInt(g.lastAmountBid) || 0) + 1, face: 6 }); await tick(); return "bid"; };
  } else {
    const bot = require(path.join(root, "scripts/gameSim/secretDictatorBot"));
    const L = 600000;
    made = await makeGame(require(path.join(root, "Games/types/SecretDictator/Game")), { players: 7, setup: { total: 7, roles: [{ "Liberal:": 4, "Fascist:": 2, "Dictator:": 1 }] }, settings: { stateLengths: { Nomination: L, Election: L, "Legislative Session": L, "Executive Action": L } } });
    await waitFor(() => made.game.started && made.game.getStateName() == "Nomination");
    chatName = "Government";
    act = async () => { const before = made.game.getStateName(); bot.act(made.game, rng); await tick(); return before; };
  }
  if (kind == "sd") {
    let guard = 0;
    while (made.game.getStateName() != "Legislative Session" && guard++ < 50) await act();
  }
  const { game, users } = made;
  const frames = [];
  const sock = users[1].socket;
  const send = sock.send;
  sock.send = (e, d) => { frames.push([e, JSON.parse(JSON.stringify(d ?? null))]); return send(e, d); };
  // initial snapshot as the client gets it on (re)connect
  const p = game.players.array().find((x) => x.user === users[1]);
  frames.push(["history", JSON.parse(JSON.stringify(p.history.getHistoryInfo()))]);
  frames.push(["players", JSON.parse(JSON.stringify(Object.fromEntries(game.players.array().map((x) => [x.id, { id: x.id, name: x.name, alive: x.alive }]))))]);
  frames.push(["self", p.id]);
  frames.length = 3;
  seedChat(game, chatName, N);
  const all = { frames: 0, bytes: 0, chatResends: 0, chatResendBytes: 0 };
  for (const u of users) {
    const inner = u.socket.send;
    u.socket.send = (e, d) => {
      const b = Buffer.byteLength(JSON.stringify([e, d ?? null]));
      all.frames++; all.bytes += b;
      if (e == "meeting" && d && d.name == chatName) { all.chatResends++; all.chatResendBytes += b; }
      return inner(e, d);
    };
  }
  const marker = frames.length;
  const labels = [];
  let bytes = 0;
  for (let i = 0; i < K && !game.finished; i++) {
    const from = frames.length;
    const label = await act();
    const slice = frames.slice(from);
    const b = slice.reduce((s, f) => s + Buffer.byteLength(JSON.stringify(f)), 0);
    bytes += b;
    labels.push({ label, from, to: frames.length, frames: slice.length, bytes: b, stateChanged: slice.some((f) => f[0] == "state" && f[1].id != (game.currentState)) });
  }
  require("fs").writeFileSync(out, JSON.stringify({ kind, N, marker, frames, labels }));
  const measured = frames.slice(marker);
  const per = labels.length;
  console.log(JSON.stringify({ kind, N, actions: per, allSockets: { framesPerAction: +(all.frames / per).toFixed(1), bytesPerAction: Math.round(all.bytes / per), chatResends: all.chatResends, chatResendBytes: all.chatResendBytes }, framesPerAction: +(labels.reduce((s, l) => s + l.frames, 0) / per).toFixed(1), bytesPerAction: Math.round(bytes / per), stateIds: [...new Set(measured.filter((f) => f[0] == "state").map((f) => f[1].id))].length, chatMeetingResends: measured.filter((f) => f[0] == "meeting" && f[1].name == chatName).length, chatMeetingResendBytes: measured.filter((f) => f[0] == "meeting" && f[1].name == chatName).reduce((s, f) => s + JSON.stringify(f).length, 0) }));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
