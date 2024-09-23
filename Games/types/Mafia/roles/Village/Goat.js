const Role = require("../../Role");

module.exports = class Goat extends Role {
  constructor(player, data) {
    super("Goat", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinSwap", "MeetingFaction"];
  }
};
