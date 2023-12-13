const Role = require("../../Role");

module.exports = class Bookie extends Role {
  constructor(player, data) {
    super("Bookie", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "BookieWager",
    ];
  }
};
