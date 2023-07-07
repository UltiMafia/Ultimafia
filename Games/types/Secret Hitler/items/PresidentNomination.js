const Item = require("../Item");

module.exports = class PresidentNomination extends Item {
  constructor() {
    super("President Nomination");

    this.meetings = {
        "Nominate Chancellor": {
          states: ["Election"],
          flags: ["voting"],
          targets: { include: ["alive"], exclude: ["self"] },
          action: {
            labels: ["hidden"],
            run: function () {
              this.target.holdItem("ChancellorNomination");
              this.game.queueAlert(`${this.target.name} has been nominated for Chancellorship.`);
              for (let player of this.game.players) {
                player.holdItem("ElectionVote");
              }
            },
          },
        },
      };
  }

  hold(player) {
    super.hold(player);
    player.game.queueAlert(`${player.name} is nominsting a candidate for Chancellorship…`);
  }
};
