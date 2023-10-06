const Item = require("../Item");

module.exports = class PresidentialCandidate extends Item {
  constructor() {
    super("Presidential Candidate");

    this.lifespan = 1;
    this.meetings = {
      "Nominate Chancellor": {
        states: ["Nomination"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive"], exclude: ["self", isPrevGovernment] },
        action: {
          item: this,
          run: function () {
            this.game.chancellorNominee = this.target;
            this.game.queueAlert(`${this.target.name} has been nominated.`);

            this.game.specialElection = false;
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} is the president and is nominating a candidate for Chancellorship…`
    );
  }
};

function isPrevGovernment(player) {
  if (player == this.game.lastElectedChancellor) {
    return true;
  }

  if (
    this.game.alivePlayers().length > 5 &&
    player == this.game.lastElectedPresident
  ) {
    return true;
  }

  return false;
}
