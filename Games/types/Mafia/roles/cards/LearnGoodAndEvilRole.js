const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnGoodAndEvilRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Dowse: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          role: this.role,
          labels: ["investigate", "role"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            this.actor.role.data.prevTarget = this.target;

            let info = this.game.createInformation(
              "GoodOrEvilRoleInfo",
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

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
