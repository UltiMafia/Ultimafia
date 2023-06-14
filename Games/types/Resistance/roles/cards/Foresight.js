const Card = require("../../Card");

module.exports = class Foresight extends Card {
  constructor(role) {
    super(role);

    this.stateMods = {
      Epilogue: {
        type: "add",
        index: 5,

        length: 1000 * 60,
        shouldSkip() {
          return !(
            this.game.mission - 1 - this.game.missionFails >=
            this.game.numMissions / 2
          );
        },
      },
    };

    this.listeners = {
      start() {
        for (const player of this.game.players) {
          if (player.role.appearance.merlin) {
            player.role.revealToPlayer(this.player, false, "merlin");
          }
        }
      },
    };
  }
};
