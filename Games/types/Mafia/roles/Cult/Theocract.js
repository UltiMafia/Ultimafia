const Role = require("../../Role");

module.exports = class Theocract extends Role {
  constructor(player, data) {
    super("Theocract", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "MakeCondemnImmune",
    ];
  }
};
