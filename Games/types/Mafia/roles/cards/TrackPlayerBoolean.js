const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackPlayerBoolean extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Track (Boolean)": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            let info = this.game.createInformation(
              "BinaryTrackerInfo",
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
