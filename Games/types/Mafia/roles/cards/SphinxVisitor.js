const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");

module.exports = class SphinxVisitor extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Visit Player": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        shouldMeet: function () {
          // Only show if sequence is set and it's not the first night
          return (
            this.numberSequence != null
          );
        },
        action: {
          labels: ["visit"],
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          run: function () {
            if (this.role.numberSequence == null) {
              this.game.sendAlert(
                "You must choose a number sequence first!",
                [this.actor]
              );
              return; // Can't visit until sequence is chosen
            }

            // Give the target the SphinxRiddle effect
            this.actor.role.giveEffect(
              this.target,
              "SphinxRiddle",
              this.actor,
              this.role.numberSequence
            );
          },
        },
      },
    };
  }
};
