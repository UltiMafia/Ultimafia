const { vote } = require("./harness");

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function choose(game, player, meeting, rng) {
  const targets = Array.isArray(meeting.targets) ? meeting.targets : [];
  const fascist = player.role.alignment == "Fascists";
  switch (meeting.name) {
    case "Election Vote":
      return rng() < 0.75 ? "Ja!" : "Nein!";
    case "Discard Policy": {
      const unwanted = fascist ? "Liberal" : "Fascist";
      return targets.includes(unwanted) ? unwanted : targets[0];
    }
    case "Enact Policy":
    case "Enact Policy (No Veto)": {
      const wanted = fascist ? "Fascist" : "Liberal";
      if (targets.includes("Veto Agenda") && !targets.includes(wanted) && rng() < 0.5)
        return "Veto Agenda";
      return targets.includes(wanted) ? wanted : targets.find((t) => t != "Veto Agenda");
    }
    case "Assent Veto":
      return rng() < 0.5 ? "Yes" : "No";
    default:
      return targets.length ? pick(targets, rng) : null;
  }
}

function pending(game) {
  const out = [];
  for (const player of game.players) {
    if (!player.alive) continue;
    for (const meeting of player.getMeetings()) {
      if (!meeting.voting || meeting.finished) continue;
      const member = meeting.members[player.id];
      if (!member || !member.canVote) continue;
      if (meeting.votes[player.id] !== undefined) continue;
      out.push({ player, meeting });
    }
  }
  return out;
}

function act(game, rng = Math.random, only) {
  let acted = 0;
  for (const { player, meeting } of pending(game)) {
    if (only && !only(meeting)) continue;
    const selection = choose(game, player, meeting, rng);
    if (selection == null) continue;
    vote(player, meeting, selection);
    acted += 1;
  }
  return acted;
}

module.exports = { act, pending, choose };
