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

        for (let p of this.game.players) {
          p.giveEffect("CannotBeVoted", 1);
        }
      },
    };
  }
};
