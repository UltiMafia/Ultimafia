const Role = require("../../Role");

module.exports = class Barista extends Role {
  constructor(player, data) {
    super("Barista", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CoffeeGiver",
    ];
  }
};
