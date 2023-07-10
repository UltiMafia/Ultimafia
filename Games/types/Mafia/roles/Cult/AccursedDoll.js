const Role = require("../../Role");

module.exports = class AccursedDoll extends Role {
  constructor(player, data) {
    super("Accursed Doll", player, data);

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
