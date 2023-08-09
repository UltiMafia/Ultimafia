const Item = require("../Item");

module.exports = class InvestigateLoyalty extends Item {
  constructor() {
    super("Investigate Loyalty");

    this.lifespan = 1;
    this.meetings = {
      "Investigate Loyalty": {
        states: ["Executive Action"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", hasBeenInvestigated] },
        action: {
          run: function () {
            this.target.investigated = true;
            let alignment = this.target.role.alignment;
            this.game.queueAlert(
              `The President has learnt the loyalty of ${this.target.name}.`
            );
            this.actor.queueAlert(
              `You learn that ${this.target.name} is loyal towards the ${alignment}.`
            );
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    this.game.queueAlert(
      `The President ${player.name} is investigating the loyalty of someone…`
    );
  }
};

function hasBeenInvestigated(player) {
  return player.investigated;
}
