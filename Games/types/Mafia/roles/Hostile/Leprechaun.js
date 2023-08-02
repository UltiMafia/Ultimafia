const Role = require("../../Role");

module.exports = class Leprechaun extends Role {
  constructor(player, data) {
    super("Leprechaun", player, data);

    this.alignment = "Hostile";
    this.cards = [
      "VillageCore",
      "StealAllItemsAndClovers",
      "WinByStealingClovers",
    ];
  }
};
