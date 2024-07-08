const Role = require("../../Role");

module.exports = class Mezepheles extends Role {
  constructor(player, data) {
    super("Mezepheles", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "CurseWithWordCult",
    ];
  }
};
