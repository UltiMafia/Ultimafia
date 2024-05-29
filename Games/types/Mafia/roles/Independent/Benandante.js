const Role = require("../../Role");

module.exports = class Benandante extends Role {
  constructor(player, data) {
    super("Benandante", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "MeetingMafia",
      "MeetingCult",
      "WinWithMafiaOrCult",
    ];
  }
};
