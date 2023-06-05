const Role = require("../../Role");

module.exports = class Prosecutor extends Role {
  constructor(player, data) {
    super("Prosecutor", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "VoteWeightTwo",
    ];
  }
};
