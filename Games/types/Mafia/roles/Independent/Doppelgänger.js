const Role = require("../../Role");

module.exports = class Doppelgänger extends Role {
  constructor(player, data) {
    super("Doppelgänger", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "BecomeRoleInstantly"];
  }
};
