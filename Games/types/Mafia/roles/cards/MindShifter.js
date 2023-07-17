const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MindShifter extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Warp Mind": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Cult"] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.role.data.insane = this.target;
            this.target.queueAlert(
              "You will be driven insane if you are not visited by a non-Cult player tonight!"
            );
          },
        },
      },
    };

    this.actions = [
      {
        labels: ["giveEffect", "insanity"],
        priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let target = this.actor.role.data.insane;
          if (!target) {
            return;
          }

          var visitors = this.getVisitors(this.actor.role.data.insane);
          var becomesInsane = !visitors.find(
            (visitor) => visitor.role.alignment != "Cult"
          );

          if (becomesInsane && this.dominates(target)) {
            target.giveEffect("Insanity");
          }

          delete this.actor.role.data.insane;
        },
      },
    ];
  }
};
