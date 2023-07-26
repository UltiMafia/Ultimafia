const Card = require("../../Card");
const { PRIORITY_QUEUE_ACTIONS } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class Visit extends Card {
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
          priority: PRIORITY_QUEUE_ACTIONS,
          run: function () {
            if (this.target === "No") {
              return;
            }
            for (const player of this.game.alivePlayers()) {
              this.game.queueAction(
                new Action({
                  actor: this.actor,
                  target: player,
                  game: this.game,
                  run: () => {},
                }),
                true
              );
            }
            this.actor.role.data.hasVisitedEveryone = true;
          },
        },
      },
    };
  }
};