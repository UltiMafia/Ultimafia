const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class KillVoteOnCondemn extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      actionsNext: function () {
        if (this.game.getStateName() != "Day") return;

        var wascondemned = false;
        var condemnMeeting;

        for (let action of this.game.actions[0]) {
          if (action.target == this.player && action.hasLabel("condemn")) {
            wascondemned = true;
            condemnMeeting = action.meeting;
            break;
          }
        }

        if (!wascondemned) return;

        var target = this.game.getPlayer(condemnMeeting.votes[this.player.id]);

        if (!target) return;

        this.game.queueAction(
          new Action({
            actor: this.player,
            target: target,
            game: this.game,
            labels: ["kill"],
            run: function () {
              if (this.dominates()) this.target.kill("basic", this.actor);
            },
          })
        );
      },
    };
  }
};
