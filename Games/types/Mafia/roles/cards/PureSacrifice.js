const Card = require("../../Card");

module.exports = class PureSacrifice extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && deathType == "condemn") {
          this.game.queueAlert("The virgin has been sacrificed!");
          for (let _player of this.game.players) {
            _player.setTempImmunity("kill", 5);
          }
          this.data.sacrifice = true;
        }
      },
      state: function () {
        if (this.data.sacrifice) {
          for (let _player of this.game.players) {
            _player.setTempImmunity("kill", 5);
          }
          delete this.data.sacrifice;
        }
      },
    };
  }
};
