const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Track: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            let info = this.game.createInformation(
              "TrackerInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();

            this.actor.queueAlert(`:track: ${info.getInfoFormated()}`);
          },
        },
      },
    };
  }
};
