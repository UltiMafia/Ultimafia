const Role = require("../../Role");

module.exports = class Alchemist extends Role {
  constructor(player, data) {
    super("Alchemist", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "PotionCaster"];
  }
};
