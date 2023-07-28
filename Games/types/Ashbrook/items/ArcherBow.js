const Item = require("../Item");

module.exports = class ArcherBow extends Item {
  constructor() {
    super("ArcherBow");

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
              if (this.target.role.alignment == "Leader") {
                this.target.kill("basic", this.actor, true);
                this.actor.queueAlert("You hit the Leader with your bow!");
              } else {
                this.actor.queueAlert("Nobody dies from your bow... You must have not hit the Leader.");
              }
          }
        },
      },
    };
  };
}

