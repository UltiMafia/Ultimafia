const Role = require("../../Role");

module.exports = class Groundskeeper extends Role {
  constructor(player, data) {
    super("Groundskeeper", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnEvilDeadCount",
    ];
  }
};
