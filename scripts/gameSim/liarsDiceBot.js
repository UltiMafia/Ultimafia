const { meetingOf, vote } = require("./harness");

function holder(game) {
  return game.players
    .array()
    .find((p) => p.alive && p.items.some((i) => i.name == "Microphone"));
}

function favouriteFace(player) {
  const counts = {};
  for (const die of player.rolledDice || []) counts[die] = (counts[die] || 0) + 1;
  let best = 6;
  for (const face in counts) if (counts[face] > (counts[best] || 0)) best = Number(face);
  return best;
}

function chooseMove(game, player, rng = Math.random) {
  const last = parseInt(game.lastAmountBid) || 0;
  const expected = Math.ceil(game.allDice / 3);
  if (game.lastBidder && last >= expected + (rng() < 0.5 ? 0 : 1)) {
    if (game.spotOn && last == expected && rng() < 0.3) return { call: "SpotOn" };
    return { call: "CallLie" };
  }
  return { amount: last + 1, face: favouriteFace(player) };
}

function act(game, move) {
  const player = holder(game);
  if (!player) return null;
  move = move || chooseMove(game, player);
  if (move.call) {
    vote(player, meetingOf(player, move.call), "Yes!");
  } else {
    vote(player, meetingOf(player, "Face"), `dice${move.face}`);
    vote(player, meetingOf(player, "Amount"), String(move.amount));
  }
  return { player, move };
}

module.exports = { holder, chooseMove, act };
