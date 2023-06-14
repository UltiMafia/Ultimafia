const Card = require("../../Card");

module.exports = class DisableVotingIfDeadAtNight extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death(player, killer, killType) {
        if (player != this.player) {
          return;
        }

        if (this.game.getStateName() != "Night") {
          return;
        }

        for (const p of this.game.alivePlayers()) {
          p.giveEffect("CannotVote", 1);
        }
      },
    };
  }
};
