const Role = require("../../Role");

module.exports = class Fungoid extends Role {
  constructor(player, data) {
    super("Fungoid", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "FungalSpores"];
  }
};
