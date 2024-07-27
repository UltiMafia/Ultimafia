const Role = require("../../Role");

module.exports = class MiGo extends Role {
  constructor(player, data) {
    super("Mi-Go", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "ConvertToChosenRole",
    ];
  }
};
