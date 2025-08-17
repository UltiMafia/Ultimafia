const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class WatchPlayerBoolean extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Watch (Boolean)": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
          run: function () {
            let info = this.game.createInformation(
              "BinaryWatcherInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            this.actor.queueAlert(`:watch: ${info.getInfoFormated()}`);
          },
        },
      },
    };
  }
};
