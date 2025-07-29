const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class Expose1to3ExcessRoles extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Show: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "custom",
        targets: ["1", "2", "3"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT - 10,
          labels: ["investigate"],
          run: function () {
            let info = this.game.createInformation(
              "ExcessRolesInfo",
              this.actor,
              this.game,
              this.target,
              false
            );
            info.processInfo();
            var alert = `:loud: ${
              this.actor.role.name
            } Lets ${info.getInfoFormated()}.`;
            this.game.queueAlert(alert);
            return;

            //End If/else
          },
        },
      },
    };
  }
};
//};
