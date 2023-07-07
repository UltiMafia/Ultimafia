const Card = require("../../Card");

module.exports = class GameCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Nominate President": {
        states: ["Election"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["hidden"],
          run: function () {
            this.target.holdItem("PresidentNomination");
            this.game.queueAlert(`${this.target.name} has been nominated for Presidency.`);
          },
        },
      },
    };
  }
};
