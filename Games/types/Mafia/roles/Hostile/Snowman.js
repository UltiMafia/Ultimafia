const Role = require("../../Role");

module.exports = class Snowman extends Role {
  constructor(player, data) {
    super("Snowman", player, data);
    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinAllFrozen", "GiveSnowballs"];
    this.immunity["frozen"] = 1;
  }
};
