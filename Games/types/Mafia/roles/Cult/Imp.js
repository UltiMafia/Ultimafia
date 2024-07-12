const Role = require("../../Role");

module.exports = class Imp extends Role {
  constructor(player, data) {
    super("Imp", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "KillorPass",
      "Endangered"
    ];
  }
};
