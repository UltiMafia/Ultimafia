const Role = require("../../Role");

module.exports = class Liquidator extends Role {
  constructor(player, data) {
    super("Liquidator", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "MafiaCore",
      "WinWithFaction",
      "MeetingFaction",
      "LiquidatorShop",
    ];
    this.data.gold = 0;
    this.data.shopOptions = [];
    this.data.rerollsUsed = 0;
  }
};