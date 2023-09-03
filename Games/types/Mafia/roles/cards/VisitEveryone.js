const Card = require("../../Card");
const { PRIORITY_SUPPORT_VISIT_DEFAULT } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class VisitEveryone extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Visit Everyone?": {
        states: ["Night"],
        flags: ["voting", "noVeg"],
        inputType: "boolean",
        shouldMeet() {
          return !this.data.hasVisitedEveryone;
        },
        action: {
          priority: PRIORITY_SUPPORT_VISIT_DEFAULT - 1,
          run: function () {
            if (this.target === "No") {
              return;
            }

            for (const player of this.game.alivePlayers()) {
              const action = new Action({
                actor: this.actor,
                target: player,
                game: this.game,
                priority: PRIORITY_SUPPORT_VISIT_DEFAULT,
                run: () => {},
              });

              this.game.queueAction(action, true);
            }
            this.actor.role.data.hasVisitedEveryone = true;
          },
        },
      },
    };
  }
};
