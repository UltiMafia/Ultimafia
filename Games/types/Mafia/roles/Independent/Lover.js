const Role = require("../../Role");

module.exports = class Lover extends Role {
  constructor(player, data) {
    super("Lover", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = [
      "VillageCore",
      "BondedForLife",
      "WinWithLove",
      "TakeMeWithYou",
      "TakeYouWithMe",
    ];
  }
};
