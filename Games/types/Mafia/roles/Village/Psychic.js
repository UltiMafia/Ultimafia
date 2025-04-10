const Role = require("../../Role");

module.exports = class Psychic extends Role {
  constructor(player, data) {
    super("Psychic", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Learn2ExcessOr1Role",
    ];
  }
};
