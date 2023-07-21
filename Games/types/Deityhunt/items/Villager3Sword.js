const Item = require("../Item");

module.exports = class Villager3Sword extends Item {
  constructor() {
    super("Villager3Sword");

    this.meetings = {
      "Kill Player": {
        actionName: "Kill",
        states: ["Day"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          labels: ["kill"],
          item: this,
          run: function () {
            this.item.drop();

            // kill
            if (this.dominates());
              if (this.target.role.alignment == "Deity")
                this.target.kill("basic", this.actor, true);
          }
        },
      },
    };
  };
}

