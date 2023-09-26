const Role = require("../../Role");

module.exports = class Trickster extends Role {
  constructor(player, data) {
    super("Trickster", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RedirectActionToSelf"];
  }
};
