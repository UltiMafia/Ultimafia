const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn2NotRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Sry: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            

            let info = this.game.createInformation(
              "TwoNotRolesInfo",
              this.actor,
              this.game,
              this.target
            );
            info.processInfo();
            var alert = `:invest: ${info.getInfoFormated()}.`;
            this.actor.queueAlert(alert);

          },
        },
      },
    };
  }
};
