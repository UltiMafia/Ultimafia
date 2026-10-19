// node host.js <setupId> <bots> [lobbyName] [ld|sd]  -> hosts a private Testing-lobby game and adds <bots> test accounts
const { api } = require("./common");
(async () => {
  const [setup, bots, name, kind] = [process.argv[2], Number(process.argv[3]), process.argv[4] || "Game with bots", process.argv[5] || "ld"];
  const common = { setup, lobby: "Testing", lobbyName: name, private: true, spectating: true };
  const gameId = await api("POST", "/game/host", kind == "sd"
    ? { ...common, gameType: "Secret Dictator", stateLengths: { Nomination: 2, Election: 2, "Legislative Session": 2, "Executive Action": 2 } }
    : { ...common, gameType: "Liars Dice", stateLengths: { "Guess Dice": Number(process.env.TURN_MINUTES || 1) }, wildOnes: true, spotOn: true, startingDice: 5 });
  console.log("GAME", gameId);
  const accounts = await api("POST", "/dev/accounts", { gameId, count: bots });
  // The host is not seated; free the host so another lobby can be hosted.
  if (!process.env.KEEP_HOST) await api("POST", "/game/leave", {}).catch((e) => console.log("leave", e.message));
  console.log("ACCOUNTS", JSON.stringify(accounts.map ? accounts.map((a) => ({ id: a.id, status: a.status, name: a.name })) : accounts));
})().catch((e) => { console.error(e.message); process.exit(1); });
