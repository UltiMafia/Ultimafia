const Role = require("../../Role");

module.exports = class Turkey extends Role {
  constructor(player, data) {
    super("Turkey", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "GiveTurkeyOnDeath", "FamineStarter", "FamineImmune", "WinIfOnlyTurkeyAlive"];
  }
};
