const Role = require("../../Role");

module.exports = class Waitress extends Role {
  constructor(player, data) {
    super("Waitress", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "StealItem"];
  }
};
