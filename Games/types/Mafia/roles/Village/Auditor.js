const Role = require("../../Role");

module.exports = class Auditor extends Role {
  constructor(player, data) {
    super("Auditor", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnTrueAndFalse",
    ];
  }
};
