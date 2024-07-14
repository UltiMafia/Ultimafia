const Role = require("../../Role");

module.exports = class Mayor extends Role {
  constructor(player, data) {
    super("Mayor", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "Mayor"];
  }
};
