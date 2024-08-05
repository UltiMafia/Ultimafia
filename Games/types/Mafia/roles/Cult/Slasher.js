const Role = require("../../Role");

module.exports = class Slasher extends Role {
  constructor(player, data) {
    super("Slasher", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "LearnVisitorsPerson",
      "GainKnifeIfVisitedNonCult",
      "PoisonImmune",
    ];
  }
};
