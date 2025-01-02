const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class ReceiveReports extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Receive Reports": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["investigate", "alerts"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 1,
          run: function () {
            let info = this.game.createInformation(
              "ReportsInfo",
              this.actor,
              this.game,
              this.target
            );

            info.processInfo();
            this.actor.queueAlert(`:journ: ${info.getInfoFormated()}`);

            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
