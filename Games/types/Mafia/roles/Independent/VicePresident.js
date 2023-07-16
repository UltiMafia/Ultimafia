const Role = require("../../Role");

module.exports = class VicePresident extends Role {
  constructor(player, data) {
    super("Vice President", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "ElectOnPresidentDeath"];
  }
};
