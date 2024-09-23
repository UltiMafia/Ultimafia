const Role = require("../../Role");

module.exports = class Haruspex extends Role {
  constructor(player, data) {
    super("Haruspex", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Sacrifice",
    ];
  }
};
