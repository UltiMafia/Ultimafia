const Card = require("../../Card");

module.exports = class DisableVotingIfDeadAtNight extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, killType) {
        if (player != this.player) {
          return;
        }

        if (this.game.getStateName() != "Night") {
          return;
        }

        if (this.player.hasEffect("Insanity")) return;

        for (let p of this.game.players) {
          p.giveEffect("CannotBeVoted", 1);
        }

        this.game.queueAlert(
          "Voting has been cancelled."
        );
      },
    };
  }
};
