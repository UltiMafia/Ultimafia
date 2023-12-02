const Role = require("../../Role");

module.exports = class Occultist extends Role {
  constructor(player, data) {
    super("Occultist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "AppearAsCultist"];
  }
};
