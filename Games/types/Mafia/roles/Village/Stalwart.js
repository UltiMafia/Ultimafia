const Role = require("../../Role");

module.exports = class Stalwart extends Role {
  constructor(player, data) {
    super("Stalwart", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "ConvertImmune",
      "KillConverters",
    ];
  }
};
