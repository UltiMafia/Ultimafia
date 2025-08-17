const { addArticle } = require("../../../../core/Utils");
const Random = require("../../../../../lib/Random");
const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class WatchPlayerRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Watch: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 5,
          run: function () {
            let info = this.game.createInformation(
              "WatcherRoleInfo",
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
