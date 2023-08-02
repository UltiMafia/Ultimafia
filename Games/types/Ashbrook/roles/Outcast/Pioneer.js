const Role = require("../../Role");

module.exports = class Pioneer extends Role {
  constructor(player, data) {
    super("Pioneer", player, data);
    this.alignment = "Outcast";
    this.cards = ["VillageCore", "WinWithGood", "PioneerlessOnDeath"];
  }
};
