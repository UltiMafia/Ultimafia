const Role = require("../../Role");

module.exports = class TeaLady extends Role {
  constructor(player, data) {
    super("Tea Lady", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "ProtectNeighborsIfBothTown",
    ];
  }
};
