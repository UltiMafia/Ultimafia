const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ReceiveAllReports extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      ReceiveAllReports: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"] },
        action: {
          labels: ["investigate", "alerts"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let info = this.game.createInformation(
              "AllReportsInfo",
              this.actor,
              this.game,
              this.target
            );

            info.processInfo();
            this.actor.queueAlert(`:journ: ${info.getInfoFormated()}`);
          },
        },
      },
    };
  }
};
