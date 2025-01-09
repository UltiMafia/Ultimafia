const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class LearnTrueAndFalse extends Card {
  constructor(role) {
    super(role);

    role.openedDoor = false;

    this.meetings = {
      "Get Info": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.target == "No") return;

            let info = this.game.createInformation(
              "TrueAndFalseInfo",
              this.actor,
              this.game
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
