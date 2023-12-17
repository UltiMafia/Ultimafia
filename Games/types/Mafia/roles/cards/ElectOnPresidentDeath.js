const Card = require("../../Card");

module.exports = class ElectOnPresidentDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player) {
        if (
          player !== this.player &&
          player.role.name === "President" &&
          this.player.alive
        ) {
          this.player.setRole(
            `${player.role.name}:${player.role.modifier}`,
            player.role.data
          );
        }
      },
    };
  }
};
