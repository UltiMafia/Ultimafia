const Role = require("../../Role");

module.exports = class Flapper extends Role {
  constructor(player, data) {
    super("Flapper", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "MindRotRoleFor3Nights"];
  }
};
