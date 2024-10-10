const Role = require("../../Role");

module.exports = class Hellhound extends Role {
  constructor(player, data) {
    super("Hellhound", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinWithHounds", "HuntPrey", "Oblivious"];
  }
};
