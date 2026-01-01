const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnModifiers extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Learn Modifiers": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          role: this.role,
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let info = this.game.createInformation(
              "ModifierInfo",
              this.actor,
              this.game,
              this.target,
              null,
              this.role
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
