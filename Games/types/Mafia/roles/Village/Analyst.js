const Role = require("../../Role");

module.exports = class Analyst extends Role {
  constructor(player, data) {
    super("Analyst", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "GuessFiveRoles"];
  }
};
