const Role = require("../../Role");

module.exports = class CreepyGirl extends Role {
  constructor(player, data) {
    super("Creepy Girl", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "GiveDoll", "WinIfDiesWithDoll"];
  }
};
