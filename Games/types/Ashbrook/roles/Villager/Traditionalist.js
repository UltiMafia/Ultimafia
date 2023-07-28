const Role = require("../../Role");

module.exports = class Traditionalist extends Role {
  constructor(player, data) {
    super("Traditionalist", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "ConvertToTraditionalistIfKilledAtNight"];
  }
};
