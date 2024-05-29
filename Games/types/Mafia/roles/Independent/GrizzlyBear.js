const Role = require("../../Role");

module.exports = class GrizzlyBear extends Role {
  constructor(player, data) {
    super("Grizzly Bear", player, data);
    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinAmongLastTwo", "MassMurderer"];
  }
};
