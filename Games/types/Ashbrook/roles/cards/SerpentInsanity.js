const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class SerpentInsanity extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Drive Insane": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"]},
        action: {
          labels: ["effect", "insanity", "leader"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()) {
              this.target.giveEffect("Insanity");

              if (this.actor.role.data.insaneTarget){
                this.actor.role.data.insaneTarget.removeEffect("Insanity", true);
                this.actor.role.data.insaneTarget.kill("basic", this.actor);
              }

              this.actor.role.data.insaneTarget = this.target;
            }
          },
        },
      },
    };
  }
};
