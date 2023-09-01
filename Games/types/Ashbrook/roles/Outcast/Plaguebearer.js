const Role = require("../../Role");

module.exports = class Plaguebearer extends Role {
  constructor(player, data) {
    super("Plaguebearer", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "BecomeInsaneRole"];
  }
};
