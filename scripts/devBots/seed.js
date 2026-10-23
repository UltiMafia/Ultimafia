// node seed.js <gameId> <chatName> <messages>  -> fills the game chat with test-account messages
const { api } = require("./common");
(async () => {
  const [gameId, chatName, total] = [process.argv[2], process.argv[3], Number(process.argv[4])];
  const all = await api("GET", "/dev/accounts");
  const list = (all.accounts || all).filter((a) => a.gameId == gameId && a.status != "left");
  const evs = await api("GET", `/dev/accounts/${list[0].id}/events?since=0`);
  const meeting = (evs.events || evs).filter((e) => e.event == "meeting" && e.data && e.data.name == chatName).pop();
  // One message per account every 3.1s: the server enforces a 3s speak cooldown.
  let sent = 0;
  while (sent < total) {
    await Promise.all(list.slice(0, total - sent).map((a, i) =>
      api("POST", `/dev/accounts/${a.id}/send`, { event: "speak", data: { meetingId: meeting.data.id, content: `table talk ${sent + i}` } }).catch(() => {})));
    sent += Math.min(list.length, total - sent);
    await new Promise((r) => setTimeout(r, 3100));
  }
  console.log("seeded", total, "into", meeting.data.id);
})().catch((e) => { console.error(e.message); process.exit(1); });
