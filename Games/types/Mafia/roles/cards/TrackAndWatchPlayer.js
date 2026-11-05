const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackAndWatchPlayer extends Card {
  constructor(role) {
    super(role);

    const binary =
      role.modifier && role.modifier.split("/").includes("Binary");

    this.meetings = {
      Shadow: {
        actionName: "Track and Watch",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            let info = this.game.createInformation(
              "WatcherInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            let info2 = this.game.createInformation(
              binary ? "BinaryTrackerInfo" : "TrackerInfo",
              this.actor,
              this.game,
              this.target
            );
            info2.processInfo();

            this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);

            this.actor.queueAlert(`:track: ${info2.getInfoFormated()}`);
          },
        },
      },
    };
  }
};
