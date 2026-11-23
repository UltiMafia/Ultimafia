// Who sent a chat message, for the ping notice.
//
// Players and spectators live in separate maps keyed by their meeting id, and a
// spectator's id never appears in `players`. Looking the sender up in `players`
// alone therefore returned undefined for spectator chat, and the notice read
// "⚠ undefined pinged you!" — including in the pregame lobby, where the people
// doing the pinging are usually spectators.
export function pingSenderName(message, players, spectators) {
  const id = message && message.senderId;
  if (!id) return null;

  const player = players && players[id];
  if (player && player.name) return player.name;

  const spectator = spectators && spectators[id];
  if (spectator && spectator.name) return spectator.name;

  return null;
}
