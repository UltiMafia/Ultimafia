const Role = require("../../Role");

module.exports = class Hellhound extends Role {
  constructor(player, data) {
    super("Hellhound", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinAmongLastTwo", "HuntPrey", "Oblivious"];
  }
};
