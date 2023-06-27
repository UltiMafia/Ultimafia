const Card = require("../../Card");

module.exports = class TownCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        states: ["Day"],
        flags: ["group", "speech", "voting"],
        targets: { include: ["alive"], exclude: [isHost] },
        whileDead: true,
        passiveDead: true,
        speakDead: true,
        action: {
          labels: ["lynch"],
          run: function () {
            this.game.continueVoting = true;
            if (this.dominates()) this.target.kill();
          },
        },
      },
      "Ghost Guessing...": {
        states: ["Guess Word"],
        flags: ["group", "speech"],
        whileDead: true,
        passiveDead: true,
        speakDead: true,
      }
    };
  }
};

function isHost(player) {
  return player.role.name == "Host";
}
