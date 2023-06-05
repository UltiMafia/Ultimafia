const Role = require("../../Role");

module.exports = class Robber extends Role {
  constructor(player, data) {
    super("Robber", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RobRole"];
  }
};
