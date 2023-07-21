const Role = require("../../Role");

module.exports = class Outcast1 extends Role {
  constructor(player, data) {
    super("Outcast1", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "KillAlignedOnDeathIfCondemned"];
  }
};
