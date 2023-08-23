const Role = require("../../Role");

module.exports = class Mailman extends Role {
  constructor(player, data) {
    super("Mailman", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GiveEnvelope"];
  }
};
