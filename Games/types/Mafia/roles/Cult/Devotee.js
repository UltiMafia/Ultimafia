const Role = require("../../Role");

module.exports = class Devotee extends Role {
  constructor(player, data) {
    super("Devotee", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Devotion",
   //   "BecomeBackUpRole",
    ];
  }
};
