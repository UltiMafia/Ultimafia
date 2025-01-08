const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class WaddleAndTellSecret extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Waddle to": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {

            let info = this.game.createInformation(
              "PenguinInfo",
              this.actor,
              this.game
            );
            info.processInfo();

            this.target.queueAlert(
              `:carol: ${info.getInfoFormated()}.`
            );
          },
        },
      },
    };
  }
};
