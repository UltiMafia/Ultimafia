const Card = require("../../Card");

module.exports = class VisitNotPrevious extends Card {
  constructor(role) {
    super(role);

    this.meetingMods = {
      "*": {
        targets: function (meetingName) {
          // core meetings
          if (meetingName == "Village")
            return { include: ["alive"], exclude: [cannotBeVoted] };
          if (meetingName == "Mafia")
            return {
              include: ["alive"],
              exclude: [excludeMafiaOnlyIfNotAnonymous],
            };
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
          } else return targets: { include: ["alive"], exclude: ["self", isPrevTargets] };
        },
      },
    };
    this.listeners = {
      afterActions: function () {
        if (!this.player.alive) return;
        if (this.game.getStateName() != "Night") return;
        let action = new Action({
          actor: this.player,
          target: this.player,
          game: this.player.game,
          labels: ["absolute", "hidden"],
          run: function () {
            this.actor.role.data.prevTargets = this.getVisits();
          },
        });
        action.do();
      },
    };
  }
};

function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted");
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

function isPrevTargets(player) {
  let prevTargets = this.role.data.prevTargets;
  return this.role && prevTargets.include(player);
}
