const Role = require("../../Role");

module.exports = class Picciotto extends Role {
  constructor(player, data) {
    super("Picciotto", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "ConvertIfVisitsAllMafia"];
  }
};
