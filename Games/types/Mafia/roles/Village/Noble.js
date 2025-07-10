const Role = require("../../Role");

module.exports = class Noble extends Role {
  constructor(player, data) {
    super("Noble", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "Learn2Good1Evil"];
  }
};
