const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ReceiveAllReports extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Receive Reports": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"] },
        action: {
          labels: ["investigate", "alerts"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let reports = this.getAllReports();
            let alert;
            if (reports.length)
              alert = `:sy0e: You received all reports that ${
                this.target.name
              } received: ( ${reports.join(", ")}).`;
            else alert = `:sy0e: ${this.target.name} received no reports.`;
            this.actor.queueAlert(alert);
          },
        },
      },
    };
  }
};
