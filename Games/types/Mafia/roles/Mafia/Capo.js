
const Role = require("../../Role");

module.exports = class Capo extends Role {
  constructor(player, data) {
    super("Capo", player, data);

    this.alignment = "Capo";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "KillTargetIfVisited",
    ];
  }
};