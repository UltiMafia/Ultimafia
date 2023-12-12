const Role = require("../../Role");

module.exports = class Gremlin extends Role {
  constructor(player, data) {
    super("Gremlin", player, data);
    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "CorruptAllItems",
    ];
  }
};
