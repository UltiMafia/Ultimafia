const Role = require("../../Role");

module.exports = class Profiler extends Role {
  constructor(player, data) {
    super("Profiler", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnModifiers",
    ];
  }
};
