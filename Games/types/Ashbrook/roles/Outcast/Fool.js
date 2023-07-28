const Role = require("../../Role");

module.exports = class Fool extends Role {
  constructor(player, data) {
    super("Fool", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "GoodLosesIfCondemned"];
  }
};
