const Role = require("../../Role");

module.exports = class Mummy extends Role {
  constructor(player, data) {
    super("Mummy", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "KillVisitorsWhileDead",
      "EnqueueVisitors",
    ];
  }
};
