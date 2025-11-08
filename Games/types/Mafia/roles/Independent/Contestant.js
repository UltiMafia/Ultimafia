const Role = require("../../Role");

module.exports = class Contestant extends Role {
  constructor(player, data) {
    super("Contestant", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "HaveRolePickedByHost"];
  }
};
