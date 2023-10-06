const Role = require("../../Role");

module.exports = class Drunk extends Role {
  constructor(player, data) {
    super("Drunk", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "BecomeExcessRole"];
  }
};
