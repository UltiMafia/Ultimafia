const Card = require("../../Card");

module.exports = class InheritFirstDeadAligned extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player) {
        if (
          player !== this.player &&
          !isVanillaRole(player) &&
          this.player.alive
        ) {
          this.player.setRole(`${player.role.name}:${player.role.modifier}`, player.role.data);
        }
      },
    };
  }
};
