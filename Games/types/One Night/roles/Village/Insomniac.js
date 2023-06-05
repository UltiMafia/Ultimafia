const Role = require("../../Role");

module.exports = class Insomniac extends Role {
  constructor(player, data) {
    super("Insomniac", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RevealSelfRole"];
  }
};
