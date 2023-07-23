const Role = require("../../Role");

module.exports = class Gossiper extends Role {
  constructor(player, data) {
    super("Gossiper", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "StartWithLeak",
    ];
  }
};
