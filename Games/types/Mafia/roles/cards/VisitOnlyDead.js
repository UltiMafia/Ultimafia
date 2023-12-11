const Card = require("../../Card");

module.exports = class VisitOnlyDead extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        targets: function (meetingName) {
          // core meetings
          if (meetingName == "Village") return { include: ["alive"], exclude: [isHost] };
          if (meetingName == "Mafia") return { include: ["alive"], exclude: [excludeMafiaOnlyIfNotAnonymous] };
          if (meetingName == "Cult") return;

          // meetings invited by others
          if (
            meetingName == "Party!" ||
            meetingName == "Hot Springs" ||
            meetingName == "Banquet" ||
            meetingName.startsWith("Jail with") ||
            meetingName.startsWith("Seance with")
          ) {
            return;
          } else return { include: ["dead"], exclude: ["alive"]};
        },
      },
    };
  }
};

function isHost(player) {
  return player.role.name == "Host";
}

function excludeMafiaOnlyIfNotAnonymous(player) {
  let mafiaMeeting = player.game.getMeetingByName("Mafia");
  if (mafiaMeeting.anonymous) {
    return false;
  }

  if (player.role.alignment == "Mafia") {
    return true;
  }
}
