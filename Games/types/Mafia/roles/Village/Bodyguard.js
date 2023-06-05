const Role = require("../../Role");

module.exports = class Bodyguard extends Role {
  constructor(player, data) {
    super("Bodyguard", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "NightBodyguard"];
  }
};
