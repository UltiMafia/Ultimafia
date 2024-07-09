const Role = require("../../Role");

module.exports = class Pedagogue extends Role {
  constructor(player, data) {
    super("Pedagogue", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "RandomizeMafiaPartner",
    ];
  }
};
