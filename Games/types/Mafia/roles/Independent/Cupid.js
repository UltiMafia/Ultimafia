const Role = require("../../Role");

module.exports = class Cupid extends Role {
  constructor(player, data) {
    super("Cupid", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "MakeTargetsInLove", "WinIfPairedLoversAlive"];
  }
};
