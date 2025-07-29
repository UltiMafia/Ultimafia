const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class Learn2ExcessOr1Role extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      See: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["2 Excess Roles", "1 Player Role"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          labels: ["investigate"],
          run: function () {
            if (this.target == "2 Excess Roles") {
              let info = this.game.createInformation(
                "ExcessRolesInfo",
                this.actor,
                this.game,
                2,
                false
              );
              info.processInfo();
              var alert = `:invest: ${info.getInfoFormated()}.`;
              this.actor.queueAlert(alert);
              return;
            } else if (this.target == "1 Player Role") {
              let info = this.game.createInformation(
                "RoleInfo",
                this.actor,
                this.game
              );
              info.processInfo();
              var alert = `:invest: ${info.getInfoFormated()}.`;
              this.actor.queueAlert(alert);
            }

            //End If/else
          },
        },
      },
    };
  }
};
//};
