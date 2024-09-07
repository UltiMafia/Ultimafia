const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightExorcise extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Exorcise Player": {
        actionName: "Exorcise",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["dead"], exclude: ["alive", "self"] },
        action: {
          labels: ["exorcise"],
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if(this.target.alive) return;
            if (this.dominates()){ 
              this.game.exorcisePlayer(this.target);
              }
          },
        },
      },
    };
  }
};
