const Role = require("../../Role");

module.exports = class Wannabe extends Role {
  constructor(player, data) {
    super("Wannabe", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Wannabe",
      "Humble",
    ];
  }
};
