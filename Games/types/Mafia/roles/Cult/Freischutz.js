const Role = require("../../Role");

module.exports = class Freischutz extends Role {
  constructor(player, data) {
    super("Freischütz", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "MagicGunGiver"];
  }
};
