const Role = require("../../Role");

module.exports = class Changeling extends Role {
  constructor(player, data) {
    super("Changeling", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "RandomizeCultPartner",
    ];
  }
};
