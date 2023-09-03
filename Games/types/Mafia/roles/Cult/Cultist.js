const Role = require("../../Role");

module.exports = class Cultist extends Role {
  constructor(player, data) {
    super("Cultist", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult"];
  }
};
