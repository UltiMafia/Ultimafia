const Role = require("../../Role");

module.exports = class Doppelganger extends Role {
  constructor(player, data) {
    super("Doppelganger", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "NightDoppelganger"];
  }
};
