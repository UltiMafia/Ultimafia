const Card = require("../../Card");
const Action = require("../../Action");

module.exports = class ConvertTownBlueOnDeath extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      death: function (player, killer, instant) {
        if (!this.hasAbility(["Convert", "WhenDead"])) {
          return;
        }
        if (player == this.player) {
          this.game.queueAlert(
            "The Schoolmarm has died… who will be left to teach anyone?"
          );
          let action = new Action({
                  actor: this.actor,
                  target: this.target,
                  role: this.role,
                  game: this.game,
                  labels: ["convert"],
                  run: function () {
                    if (this.dominates()) {
                    }
                  },
                });
          for (let _player of this.game.players) {
            if (_player.alive && _player.getRoleAlignment() === "Village" && action.dominates(_player)) {
              _player.setRole("Villager", null, null, null, null, "No Change");
            }
            this.data.paintBlue = true;
          }
        }
      },
      start: function () {
        if (this.data.paintBlue) {
          for (let _player of this.game.players) {
            _player.setRole("Villager");
          }
          delete this.data.paintBlue;
        }
      },
    };
  }
};
