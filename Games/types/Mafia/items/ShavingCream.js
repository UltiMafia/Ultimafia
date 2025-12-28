const Item = require("../Item");
const Action = require("../Action");
const { PRIORITY_SWAP_ROLES } = require("../const/Priority");

module.exports = class ShavingCream extends Item {
  constructor(options) {
    super("Shaving Cream");

    this.broken = options?.broken;
    this.meetings = {
      "Swap Players": {
        actionName: "Swap Players (Choose 2)",
        states: ["Night"],
        flags: ["voting", "multi", "noVeg"],
        actor: this.holder,
        targets: { include: ["alive", "self"] },
        multiMin: 2,
        multiMax: 2,
        item: this,
        action: {
          labels: ["hidden", "convert"],
          priority: PRIORITY_SWAP_ROLES,
          item: this,
          run: function () {
            var broken = this.item.broken;
            this.item.drop();

            if (broken) {
              return;
            }

            var targetA = this.target[0];
            var targetB = this.target[1];

            if (!targetA || !targetB) return;

            if (
              this.dominates(this.target[0]) &&
              this.dominates(this.target[1])
            ) {
              var oldARole = `${targetA.getRoleName()}:${targetA.getModifierName()}`;
              var oldARoleData = targetA.role.data;

              targetA.setRole(
                `${targetB.getRoleName()}:${targetB.getModifierName()}`,
                targetB.role.data,
                false,
                false,
                false,
                "No Change"
              );
              targetB.setRole(
                oldARole,
                oldARoleData,
                false,
                false,
                false,
                "No Change"
              );
            }
          },
        },
      },
    };
  }
};
