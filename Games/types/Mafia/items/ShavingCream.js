const Item = require("../Item");
const { PRIORITY_SWAP_ROLES } = require("../const/Priority");

module.exports = class ShavingCream extends Item {
  constructor(options) {
    super("Shaving Cream");

    this.cursed = options?.cursed;
    this.meetings = {
      "Swap Players": {
        actionName: "Player A",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["hidden","convert"],
          priority: PRIORITY_SWAP_ROLES-1,
          run: function () {
            this.item.targetA = this.target;
          },
        },
      },
      "Swap Players": {
        actionName: "Player B",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["hidden","convert"],
          priority: PRIORITY_SWAP_ROLES,
          run: function () {
            var cursed = this.item.cursed;
            this.item.drop();
            
            if (!this.dominates()) return;

            if (cursed) {
              return;
            }
            
            var targetA = this.item.targetA;
            var targetB = this.target;
            var oldARole = `${targetA.role.name}:${targetA.role.modifier}`;
            var oldARoleData = targetA.role.data.

            targetA.setRole(`${targetB.role.name}:${targetB.role.modifier}`,targetB.role.data,true);
            targetB.setRole(oldARole, oldARoleData, true);
          },
        },
      },
    };
    
  }
};
