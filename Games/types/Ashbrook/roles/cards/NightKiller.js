const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightKiller extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Leader Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function () {
          return this.game.getStateInfo().id > 1;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};
