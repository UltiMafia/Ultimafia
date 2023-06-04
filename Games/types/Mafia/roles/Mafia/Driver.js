const Role = require("../../Role");

module.exports = class Driver extends Role {
  constructor(player, data) {
    super("Driver", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "SwapVisitors",
    ];
  }
};
