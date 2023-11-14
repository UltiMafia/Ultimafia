const Role = require("../../Role");

module.exports = class Inquisitor extends Role {
  constructor(player, data) {
    super("Inquisitor", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "Vigicultist"];
  }
};
