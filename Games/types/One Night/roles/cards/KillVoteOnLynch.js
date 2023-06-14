const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class KillVoteOnLynch extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      actionsNext() {
        if (this.game.getStateName() != "Day") return;

        let wasLynched = false;
        let lynchMeeting;

        for (const action of this.game.actions[0]) {
          if (action.target == this.player && action.hasLabel("lynch")) {
            wasLynched = true;
            lynchMeeting = action.meeting;
            break;
          }
        }

        if (!wasLynched) return;

        const target = this.game.getPlayer(lynchMeeting.votes[this.player.id]);

        if (!target) return;

        this.game.queueAction(
          new Action({
            actor: this.player,
            target,
            game: this.game,
            labels: ["kill"],
            run() {
              if (this.dominates()) this.target.kill("basic", this.actor);
            },
          })
        );
      },
    };
  }
};
