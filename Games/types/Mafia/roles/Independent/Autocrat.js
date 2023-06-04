const Role = require("../../Role");

module.exports = class Autocrat extends Role {
  constructor(player, data) {
    super("Autocrat", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinInsteadOfVillage"];
  }
};
