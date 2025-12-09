const Role = require("../../Role");

module.exports = class Sleuth extends Role {
  constructor(player, data) {
    super("Sleuth", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnFullAlignment",
      "Sleuthing",
    ];
  }
};
