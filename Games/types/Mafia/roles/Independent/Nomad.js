const Role = require("../../Role");

module.exports = class Nomad extends Role {
  constructor(player, data) {
    super("Nomad", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "RoamingAlignment"];
  }
};
