const Role = require("../../Role");

module.exports = class Paparazzo extends Role {
  constructor(player, data) {
    super("Paparazzo", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "CondemnReveal",
    ];
  }
};
