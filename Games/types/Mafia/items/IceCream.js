const Item = require("../Item");
const Random = require("../../../../lib/Random");
const Player = require("../Player");
const Action = require("../Action");
const { PRIORITY_BECOME_DEAD_ROLE } = require("../const/Priority");

module.exports = class IceCream extends Item {
  constructor(options) {
    super("Ice Cream");

    this.meetings = {
      "Become Vanilla": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        item: this,
        action: {
          labels: ["hidden", "convert"],
          item: this,
          priority: PRIORITY_BECOME_DEAD_ROLE,
          run: function () {
            if (this.target != "Yes") return;
            this.item.drop();
            if (this.dominates(this.actor)) {
              const vanillaRole = this.getVanillaRole(this.actor);
              this.actor.setRole(vanillaRole);
            }
          },
        },
      },
    };
  }
};
