const Role = require("../../Role");

module.exports = class Tofurkey extends Role {
  constructor(player, data) {
    super("Tofurkey", player, data);

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
