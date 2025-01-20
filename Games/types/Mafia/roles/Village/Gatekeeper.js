const Role = require("../../Role");

module.exports = class Gatekeeper extends Role {
  constructor(player, data) {
    super("Gatekeeper", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "CauseBanishedEventsOnDeath",
    ];
  }
};
