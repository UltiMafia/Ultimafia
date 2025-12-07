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
        action: {
          labels: ["visit"],
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
          role: this.role,
          run: function () {
            if (this.role.numberSequence == null) {
              this.game.sendAlert("You must choose a number sequence first!", [
                this.actor,
              ]);
              return; // Can't visit until sequence is chosen
            }

            // Give the target the SphinxRiddle item
            this.target.holdItem(
              "SphinxRiddle",
              this.actor,
              this.role.numberSequence
            );
            this.target.queueAlert(
              `The Sphinx has chosen for you to guess their riddle. If you guess incorrectly you will die!`
            );
          },
        },
      },
    };
  }
};
