const Role = require("../../Role");

module.exports = class Poet extends Role {
  constructor(player, data) {
    super("Poet", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "ChooseWordsForGhost",
      "AddCopyOfRole",
      "WinWithFaction",
    ];
  }
};
