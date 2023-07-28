const Item = require("../Item");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class Rampager3 extends Item {
  constructor() {
    super("Rampager");

    this.lifespan = 1;

    this.meetings = {
      "Leader Kill 3": {
        actionName: "Kill (3)",
        states: ["Night"],
        flags: ["voting",  "multi", "mustAct"],
        targets: {include: ["alive"]},
        multiMin: 3,
        multiMax: 3,
        shouldMeet: function () {
          return this.game.getStateInfo().id > 1;
        },
        action: {
          labels: ["kill", "leader"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            this.target[0].kill("basic", this.actor);
            this.target[1].kill("basic", this.actor);
            this.target[2].kill("basic", this.actor);
          }
        },
      },
    };
  };
}

