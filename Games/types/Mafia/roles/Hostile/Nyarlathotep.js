const Role = require("../../Role");

module.exports = class Nyarlathotep extends Role {
  constructor(player, data) {
    super("Nyarlathotep", player, data);

    this.alignment = "Hostile";
    this.winCount = "Cult";
    this.cards = [
      "VillageCore",
      "MeetingCult",
      "WinInsteadOfCult",
      "AnonymizeCult",
      "MakeVisitorsInsane",
    ];
  }
};
