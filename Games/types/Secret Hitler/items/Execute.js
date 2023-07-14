const Item = require("../Item");

module.exports = class Execute extends Item {
  constructor() {
    super("Execute");

    this.lifespan = 1;
    this.meetings = {
      Execute: {
        states: ["Executive Action"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          run: function () {
            this.target.kill("presidentialExecution", this.actor);
            if (this.target.role.name == "Hitler") {
              this.game.hitlerAssassinated = true;
            }
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    this.game.queueAlert(`The President ${player.name} is executing someone…`);
  }
};
