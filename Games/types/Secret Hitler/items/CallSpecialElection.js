const Item = require("../Item");

module.exports = class CallSpecialElection extends Item {
  constructor() {
    super("Call Special Election");

    this.lifespan = 1;
    this.meetings = {
      "Nominate as Presidential Candidate": {
        states: ["Executive Action"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          run: function () {
            this.game.holdSpecialElection(this.target);
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    this.game.queueAlert(
      `The President ${player.name} is nominating the next Presidential Candidate…`
    );
  }
};
