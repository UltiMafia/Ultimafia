const Role = require("../../Role");

module.exports = class Atheist extends Role {
  constructor(player, data) {
    super("Atheist", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "RemoveModifers",
    ];
  }
};
