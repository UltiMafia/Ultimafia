const Role = require("../../Role");

module.exports = class Banker extends Role {
  constructor(player, data) {
    super("Banker", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "WinAmongLastTwo",
      "BankerShop",
    ];
    this.data.gold = 2;
    this.data.investAmount = 0;
    this.data.shopAnnounced = false;
  }
};