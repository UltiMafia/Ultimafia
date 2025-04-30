const Role = require("../../Role");

module.exports = class GreyGoo extends Role {
  constructor(player, data) {
    super("Grey Goo", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "GreyGooConvert", "WinWithGreyGoo"];
  }
};
