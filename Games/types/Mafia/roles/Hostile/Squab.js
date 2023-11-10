const Role = require("../../Role");

module.exports = class Squab extends Role {
  constructor(player, data) {
    super("Squab", player, data);

    this.alignment = "Hostile";
    this.cards = [
      "VillageCore",
      "MeetingTurkey",
      "SubtractTurkeyOnDeath",
      "FamineStarter",
      "FamineImmune",
      "WinIfOnlyTurkeyAlive",
    ];
  }
};
