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
          this.actor.setRole(
              `${this.target.role.name}:${this.target.role.modifier}`,
              this.target.role.data,
              false,
              false,
              true
          );
          this.game.events.emit("roleAssigned", this.actor);
        }
      },
    };
  }
};
