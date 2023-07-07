const Item = require("../Item");

module.exports = class ElectionVote extends Item {
  constructor() {
    super("Election Vote");

    this.meetings = {
        "Election Vote": {
          states: ["Election"],
          flags: ["voting"],
          inputType: "boolean",
          action: {
            labels: ["hidden"],
            run: function () {
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
