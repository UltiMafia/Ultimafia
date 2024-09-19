const Role = require("../../Role");

module.exports = class DramaQueen extends Role {
  constructor(player, data) {
    super("Drama Queen", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "StartDrama"];
  }
};
