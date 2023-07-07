const Item = require("../Item");

module.exports = class Presidency extends Item {
  constructor() {
    super("Presidency");

    this.meetings = {
        "Elect Chancellor": {
          states: ["Election"],
          flags: ["voting"],
          targets: { include: ["alive"], exclude: ["self"] },
          action: {
            labels: ["hidden"],
            run: function () {
              this.target.holdItem("Chancellorship");
            },
          },
        },
      };
  }

  hold(player) {
    super.hold(player);
    player.game.queueAlert(`${player.name} is electing the Chancellor…`);
  }
};
