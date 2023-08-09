const Role = require("../../Role");

module.exports = class Cyclist extends Role {
  constructor(player, data) {
    super("Cyclist", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "VisitEveryone",
    ];
  }
};
