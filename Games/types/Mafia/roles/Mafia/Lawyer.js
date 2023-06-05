const Role = require("../../Role");

module.exports = class Lawyer extends Role {
  constructor(player, data) {
    super("Lawyer", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "MakeInnocent",
    ];
  }
};
