const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");
const Action = require("../../Action");

module.exports = class GiveEnvelope extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Give Out Envelopes?": {
        states: ["Day"],
        flags: ["voting", "noVeg"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_ITEM_GIVER_DEFAULT,
          run: function () {
            if (this.target === "No") {
              return;
            }

            for (const player of this.game.alivePlayers()) {
              const action = new Action({
                actor: this.actor,
                target: player,
                game: this.game,
                priority: PRIORITY_ITEM_GIVER_DEFAULT,
                run: function () {
                    this.target.holdItem("Snowball");
                    this.target.queueAlert(":sy5h: You receive an envelope!");
                  },
              });

              this.game.queueAction(action, true);
            }
          },
        },
      },
    };
  }
};
