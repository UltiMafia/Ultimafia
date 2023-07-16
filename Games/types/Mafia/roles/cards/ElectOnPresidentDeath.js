const Card = require("../../Card");

module.exports = class ElectOnPresidentDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player) {
        if (this.player.alive && player.role.name === "President") {
          this.player.setRole("President");
        }
      },
    };
  }
};
