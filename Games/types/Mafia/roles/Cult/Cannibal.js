const Role = require("../../Role");

module.exports = class Cannibal extends Role {
  constructor(player, data) {
    super("Cannibal", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "CookNonCult"];
  }
};
