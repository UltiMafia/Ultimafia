const Role = require("../../Role");

module.exports = class Astrologer extends Role {
  constructor(player, data) {
    super("Astrologer", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "OnDeathAstrologer"]; // Not sure how to do the publicly thing
  }
};
