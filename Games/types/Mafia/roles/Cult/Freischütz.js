const Role = require("../../Role");

module.exports = class Freischütz extends Role {
  constructor(player, data) {
    super("Freischütz", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "GiveMagicGun"];
  }
};
