const Role = require("../../Role");

module.exports = class Voucher extends Role {
  constructor(player, data) {
    super("Voucher", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnGoodPlayerAtStart"];
  }
};
