const Role = require("../../Role");

module.exports = class Vigilante extends Role {
  constructor(player, data) {
    super("Vigilante", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "NightKiller"];
  }
};
