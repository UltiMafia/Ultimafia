const Role = require("../../Role");

module.exports = class Maestro extends Role {
  constructor(player, data) {
    super("Maestro", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Learn2Good1Evil",
    ];
  }
};
