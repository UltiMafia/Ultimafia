const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ReceiveAllVisitors extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      ReceiveAllVisitors: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"] },
        action: {
          labels: ["investigate", "alerts"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let reports = this.getAllVisitors();
            let alert;
            if (reports.length)
              alert = `:journ: You received all reports that ${
                this.target.name
              } received: ( ${reports.join(", ")}).`;
            else alert = `:journ: ${this.target.name} received no reports.`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
