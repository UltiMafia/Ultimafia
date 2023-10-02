const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GunFramer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Frame Shooter": {
        actionName: "Frame as Shooter (no visit)",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["hidden"],
          priority: PRIORITY_ITEM_GIVER_DEFAULT + 1,
          run: function () {
            this.actor.role.data.shooterMask = this.target.name;
            this.actor.role.predictedVote = this.target;
          },
        },
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.actor.holdItem("Gun");
          this.actor.queueGetItemAlert("Gun");
        }
      },
    };
  }
};
