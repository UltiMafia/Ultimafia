const Role = require("../../Role");

module.exports = class Snallygaster extends Role {
  constructor(player, data) {
    super("Snallygaster", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "Endangered",
      "KillOrCharge",
    ];
  }
};
