const Role = require("../../Role");

module.exports = class Slasher extends Role {
  constructor(player, data) {
    super("Slasher", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "EnqueueVisitors",
      "DaySlasher",
    ];
  }
};
