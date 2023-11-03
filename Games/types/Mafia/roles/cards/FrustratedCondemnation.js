const Card = require("../../Card");
const Action = require("../../../../core/Action");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class FrustratedCondemnation extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
    };

    this.immunity["condemn"] = 3;
    this.actions = [
      {
        priority: PRIORITY_DAY_DEFAULT + 1,
        labels: ["hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Day") return;

          let villageMeeting = this.game.getMeetingByName("Village");

          if (villageMeeting.finalTarget === this.actor) {
            return;
          }

          // check if it was a target
          let targeted = false;
          for (let key in villageMeeting.votes) {
            let target = villageMeeting.votes[key];
            if (target === this.actor.id) {
              targeted = true;
              break;
            }
          }
          if (!targeted) {
            return;
          }

          let action = new Action({
            actor: this.actor,
            target: this.actor,
            game: this.game,
            labels: ["kill", "frustration", "hidden"],
            power: 3,
            run: function () {
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
