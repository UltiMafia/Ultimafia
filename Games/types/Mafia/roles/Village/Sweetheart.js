const Role = require("../../Role");

module.exports = class Sweetheart extends Role {
  constructor(player, data) {
    super("Sweetheart", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GivePermaMindRot"];
  }
};
