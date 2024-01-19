const Role = require("../../Role");

module.exports = class Astrologer extends Role {
  constructor(player, data) {
    super("Astrologer", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "MakeTargetsInLove", "WinIfPairedLoversAlive"];
  }
};
