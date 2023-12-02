const Role = require("../../Role");

module.exports = class Voyeur extends Role {
  constructor(player, data) {
    super("Voyeur", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "WatchPlayerRole"];
  }
};
