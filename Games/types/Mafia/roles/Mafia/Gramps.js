const Role = require("../../Role");

module.exports = class Gramps extends Role {
  constructor(player, data) {
    super("Gramps", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "KillImmune",
      "LearnVisitors",
    ];
  }
};
