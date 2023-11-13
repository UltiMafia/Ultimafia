const Role = require("../../Role");

module.exports = class Ape extends Role {
  constructor(player, data) {
    super("Ape", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "CopyActions",
    ];
  }
};
