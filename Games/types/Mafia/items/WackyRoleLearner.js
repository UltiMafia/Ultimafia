const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class WackyRoleLearner extends Item {
  constructor(targetType) {
    super("WackyRoleLearner");

    this.targetType = targetType;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    this.meetings = {
      "Wacky Learn Role": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: [this.targetType], exclude: ["self"] },
        action: {
          labels: ["hidden", "absolute"],
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          item: this,
          run: function () {
            var role = this.target.getRoleAppearance();
            var alert = `:invest: You learn that ${this.target.name}'s role is ${role}.`;
            this.actor.queueAlert(alert);
            this.item.drop();
          },
        },
      },
    };
  }
};
