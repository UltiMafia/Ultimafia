const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackPlayer extends Card {
  constructor(role) {
    super(role);

    const binary =
      role.modifier && role.modifier.split("/").includes("Binary");

    this.meetings = {
      Track: {
        states: ["Night"],
        flags: ["voting"],
        actionName: binary ? "Observe for visits" : "Track",
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            let info = this.game.createInformation(
              binary ? "BinaryTrackerInfo" : "TrackerInfo",
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
