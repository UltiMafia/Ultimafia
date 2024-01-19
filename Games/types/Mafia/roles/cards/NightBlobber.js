const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightBlobber extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      BlobVote: {
        actionName: "Absorb",
        states: ["Night"],
        flags: ["voting", "mustAct"],
        action: {
          labels: ["kill", "consume"],
          priority: PRIORITY_KILL_DEFAULT + 1,
          run: function () {
            if (this.dominates()) {
              this.target.kill("eaten", this.actor)
              this.actor.giveEffect("ExtraLife");
            }
            var blobTarget;
            for (let action of this.game.actions[0]) {
              if (action.hasLabels(["kill", "consume"])) {
                blobTarget = action.target;
                break;
              }
            }
            if (!blobTarget) return;

            const roleName = blobTarget.getRoleAppearance("death");
            this.actor.role.lastCleanedAppearance = roleName;
            blobTarget.role.appearance.death = null;
            this.actor.role.lastCleanedWill = blobTarget.lastWill;
            blobTarget.lastWill = null;
          },
        },
      },
    };
  }
};
