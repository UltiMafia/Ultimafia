const Role = require("../../Role");

module.exports = class Rottweiler extends Role {
  constructor(player, data) {
    super("Rottweiler", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "NightTrapper",
    ];
  }
};
