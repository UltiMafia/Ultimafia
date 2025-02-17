const Role = require("../../Role");

module.exports = class Broker extends Role {
  constructor(player, data) {
    super("Broker", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "WinSwap"];
  }
};
