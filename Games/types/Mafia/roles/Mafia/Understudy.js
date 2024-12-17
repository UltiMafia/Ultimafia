const Role = require("../../Role");

module.exports = class Understudy extends Role {
  constructor(player, data) {
    super("Understudy", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BecomeBackUpRole",
    ];
  }
};
