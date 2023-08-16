const Card = require("../../Card");
const { PRIORITY_INSANITY } = require("../../const/Priority");

module.exports = class Mindwarper extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Drive Insane": {
        states: ["Night"],
        flags: ["voting"],
        whileDead: true,
        shouldMeet: function (){
          return this.player.alive || (!this.player.alive && this.player.hasItem("DeadAbilityUser"));
        },
        targets: { include: ["alive"]},
        action: {
          labels: ["effect", "insanity"],
          priority: PRIORITY_INSANITY,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()) {
              this.target.giveEffect("Insanity", 1);
            }
          },
        },
      },
    };
  }
};
