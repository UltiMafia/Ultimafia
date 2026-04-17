const Role = require("../../Role");

module.exports = class Repoman extends Role {
  constructor(player, data) {
    super("Repoman", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "MafiaCore",
      "WinWithFaction",
      "MeetingFaction",
      "RepomanShop",
    ];
    this.data.gold = 0;
    this.data.shopOptions = [];
    this.data.rerollsUsed = 0;
  }
};