const Card = require("../../Card");

module.exports = class PlayConnectFour extends Card {
  constructor(role) {
    super(role);

    let rows = [];
    for (let x = 1; x < parseInt(this.game.boardY) + 1; x++) {
      rows.push(`${x}`);
    }

    this.meetings = {
      "Place Chip": {
        actionName: "Choose Column",
        states: ["Turn"],
        flags: ["voting"],
        inputType: "custom",
        targets: rows,
        action: {
          item: this,
          run: function () {
            let values = this.game.placeChip(this.actor.name, this.target);
            if (!values) {
              return;
            }
            if (
              this.game.CheckForConnections(this.actor, values[0], values[1])
            ) {
              this.actor.Has4InaRow = true;
            }
          },
        },
        shouldMeet: function () {
          return (
            this.player.name ==
            this.game.randomizedPlayersCopy[this.game.currentIndex].name
          );
        },
      },
    };
  }
};
