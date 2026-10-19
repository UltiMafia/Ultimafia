const { api } = require("./common");
async function fetchLog(gameId) {
  let from = 0, out = [];
  while (from != null) {
    const r = await api("GET", `/dev/games/${gameId}/log?fromChunk=${from}`);
    out.push(...r.events);
    from = r.nextChunk;
  }
  return out;
}
module.exports = { fetchLog };
if (require.main === module) (async () => {
  const ev = await fetchLog(process.argv[2]);
  const skip = new Set(["time", "speakCooldown", "speak"]);
  const tail = ev.filter((x) => !skip.has(x.event)).slice(-Number(process.argv[3] || 15));
  console.log("total", ev.length);
  for (const x of tail) console.log(new Date(x.t_server_ms).toISOString().slice(11, 19), x.direction, x.userId, x.event, JSON.stringify(x.payload).slice(0, 200));
})();
