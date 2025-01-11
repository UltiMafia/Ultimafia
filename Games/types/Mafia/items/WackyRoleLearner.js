const Item = require("../Item");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../const/Priority");

module.exports = class WackyRoleLearner extends Item {
  constructor(targetType, state) {
    super("WackyRoleLearner");

    this.targetType = targetType;
    this.state = state;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    if (this.state == "Night") {
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
              let info = this.game.createInformation(
                "RoleInfo",
                this.actor,
                this.game,
                this.target
              );
              info.processInfoItem(this.item);
              var alert = `:invest: ${info.getInfoFormated()}.`;
              this.actor.queueAlert(alert);
              this.item.drop();
            },
          },
        },
      };
    } else {
      this.meetings = {
        "Wacky Learn Role": {
          states: ["Day"],
          flags: ["voting", "mustAct", "instant"],
          targets: { include: [this.targetType], exclude: ["self"] },
          action: {
            labels: ["hidden", "absolute"],
            priority: PRIORITY_INVESTIGATIVE_DEFAULT,
            item: this,
            run: function () {
              let info = this.game.createInformation(
                "RoleInfo",
                this.actor,
                this.game,
                this.target
              );
              info.processInfo();
              var alert = `:invest: ${info.getInfoFormated()}.`;
              this.actor.queueAlert(alert);
              this.item.drop();
            },
          },
        },
      };
    }
  }
};
