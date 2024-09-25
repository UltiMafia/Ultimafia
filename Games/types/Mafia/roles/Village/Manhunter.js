const Role = require("../../Role");

module.exports = class Manhunter extends Role {
  constructor(player, data) {
    super("Manhunter", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "GuessRole",
    ];
  }
};
