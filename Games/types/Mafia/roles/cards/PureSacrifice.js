const Card = require("../../Card");

module.exports = class PureSacrifice extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death(player, killer, deathType) {
        if (player == this.player && deathType == "lynch") {
          this.game.queueAlert("The virgin has been sacrificed!");
          for (const _player of this.game.players) {
            _player.setTempImmunity("kill", 5);
          }
          this.data.sacrifice = true;
        }
      },
      state() {
        if (this.data.sacrifice) {
          for (const _player of this.game.players) {
            _player.setTempImmunity("kill", 5);
          }
          delete this.data.sacrifice;
        }
      },
    };
  }
};
