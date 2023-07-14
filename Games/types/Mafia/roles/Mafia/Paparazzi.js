const Role = require("../../Role");

module.exports = class Paparazzi extends Role {
  constructor(player, data) {
    super("Paparazzi", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "CondemnReveal",
    ];
  }
};
