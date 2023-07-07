const Card = require("../../Card");

module.exports = class GameCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Elect President": {
        states: ["Election"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["hidden"],
          run: function () {
            this.player.data.electedPresident = this.target;
          },
        },
      },
      "Elect Chancellor": {
        states: ["Election"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["hidden"],
          run: function () {
            this.player.data.electedChancellor = this.target;
          },
        },
      },
    };
  }
};