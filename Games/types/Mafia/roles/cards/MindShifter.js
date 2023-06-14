const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class MindShifter extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Warp Mind": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Monsters"] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run() {
            this.actor.role.data.insane = this.target;
            this.target.queueAlert(
              "You will be driven insane if not visited by a player not aligned with the Monsters, tonight!"
            );
          },
        },
      },
    };

    this.actions = [
      {
        labels: ["effect"],
        priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
        run() {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.role.data.insane) {
            return;
          }

          const visitors = this.getVisitors(this.actor.role.data.insane);
          const becomesInsane = !visitors.find(
            (visitor) => visitor.role.alignment != "Monsters"
          );

          if (becomesInsane) {
            this.actor.role.data.insane.giveEffect("Insanity");
            this.actor.role.data.insane.queueAlert(
              ":sy3f: Reality fades as your mind is consumed by insanity."
            );
          }

          delete this.actor.role.data.insane;
        },
      },
    ];
  }
};
