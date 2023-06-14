const Card = require("../../Card");
const Action = require("../../../../core/Action");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class BlockVisitors extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_DAY_DEFAULT + 1,
        labels: ["hidden", "absolute"],
        run() {
          if (this.game.getStateName() != "Day") return;

          const villageMeeting = this.game.getMeetingByName("Village");

          if (villageMeeting.finalTarget === this.actor) {
            return;
          }

          // check if it was a target
          let targeted = false;
          for (const key in villageMeeting.votes) {
            const target = villageMeeting.votes[key];
            if (target === this.actor.id) {
              targeted = true;
              break;
            }
          }
          if (!targeted) {
            return;
          }

          const action = new Action({
            actor: this.actor,
            target: this.actor,
            game: this.game,
            labels: ["kill", "frustration", "hidden"],
            power: 3,
            run() {
              this.game.sendAlert(
                `${this.target.name} feels immensely frustrated!`
              );
              if (this.dominates()) this.target.kill("basic", this.actor);
            },
          });
          action.do();
        },
      },
    ];
  }
};
