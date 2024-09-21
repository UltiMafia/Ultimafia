const Role = require("../../Role");

module.exports = class Exorcist extends Role {
  constructor(player, data) {
    super("Exorcist", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "NightExorcise",
    ];
  }
};
