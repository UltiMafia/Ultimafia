const Item = require("../Item");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class Rampager1 extends Item {
  constructor() {
    super("Rampager");

    this.lifespan = 1;

    this.meetings = {
      "Leader Kill 1": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {include: ["alive"]},
        shouldMeet: function () {
          return this.game.getStateInfo().id > 1;
        },
        action: {
          labels: ["kill", "leader"],
          priority: PRIORITY_KILL_DEFAULT-1,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()){
              this.target.kill("basic", this.actor);
              }
            }
          },
        },
    };
  };
}

