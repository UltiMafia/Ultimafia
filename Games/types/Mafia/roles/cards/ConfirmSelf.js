const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ConfirmSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Introduce Yourself": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {

            let info = this.game.createInformation(
              "LearnTargetInfo",
              this.actor,
              this.game,
              this.actor
            );
            info.processInfo(); 
            var alert = `:mask: You learn that ${info.getInfoRaw()}'s role is ${this.actor.getRoleAppearance()}.`;

            this.target.queueAlert(alert);
          },
        },
      },
    };
  }
};
