const Role = require("../../Role");

module.exports = class Ghost extends Role {
  constructor(player, data) {
    super("Ghost", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "GhostGame", "WinWithFaction",
      "MeetingFaction"];
  }
};
