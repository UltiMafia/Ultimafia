const Role = require("../../Role");

module.exports = class Informant extends Role {
  constructor(player, data) {
    super("Informant", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "ReceiveReports",
    ];
  }
};
