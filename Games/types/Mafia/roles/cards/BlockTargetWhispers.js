const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class BlockTargetWhispers extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      BlockWhispers: {
        actionName: "Block Whispers",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          labels: ["giveEffect", "changeWhisperLeak"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            if (this.dominates()) {
              this.target.giveEffect("Block Whispers", 2);
            }
          },
        },
      },
    };
  }
};
