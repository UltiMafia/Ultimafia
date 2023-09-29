const Role = require("../../Role");

module.exports = class Carbonaro extends Role {
  constructor(player, data) {
    super("Carbonaro", player, data);

    this.alignment = "Hostile";
    this.cards = [
      "VillageCore",
      "MeetingMafia",
      "MeetingCult",
      "WinWithMafiaOrCult",
    ];
  }
};
