// Seats that left during pregame.
//
// Their pregame chat is part of the stored history, and their messages keep the
// seat id they had at the time. The saved game only lists the players who were
// still seated at the end, so review had no name or avatar for those messages
// and rendered them with nothing but the text colour. `pastPregamePlayers`
// carries a snapshot of each departed seat so the review can resolve them.
//
// They are flagged `left` so no player list shows them.
export function mergeDepartedPregamePlayers(players, raw) {
  let departed = raw;

  if (typeof raw === "string") {
    try {
      departed = JSON.parse(raw || "{}");
    } catch (e) {
      departed = {};
    }
  }

  if (!departed || typeof departed !== "object") return players;

  for (const id of Object.keys(departed)) {
    if (!id || players[id]) continue;

    const seat = departed[id] || {};

    players[id] = {
      id,
      name: seat.name,
      userId: seat.userId || "",
      avatar: seat.avatar || false,
      textColor: seat.textColor,
      nameColor: seat.nameColor,
      customEmotes: seat.customEmotes,
      customStickers: seat.customStickers,
      left: true,
      kudos: false,
      departedPregame: true,
    };
  }

  return players;
}
