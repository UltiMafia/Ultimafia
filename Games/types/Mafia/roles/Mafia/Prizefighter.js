const Role = require("../../Role");

module.exports = class Prizefighter extends Role {
  constructor(player, data) {
    super("Prizefighter", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "RandomizeMafiaPartner",
    ];
  }
};
