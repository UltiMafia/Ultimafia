const Role = require("../../Role");

module.exports = class Empath extends Role {
  constructor(player, data) {
    super("Empath", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "NeighborAlignment"];
  }
};
