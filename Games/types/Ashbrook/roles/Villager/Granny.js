const Role = require("../../Role");

module.exports = class Granny extends Role {
  constructor(player, data) {
    super("Granny", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood"];
    this.startEffects = ["LeaderImmune"];
  }
};
