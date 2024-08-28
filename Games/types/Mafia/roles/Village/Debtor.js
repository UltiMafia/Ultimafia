const Role = require("../../Role");

module.exports = class Debtor extends Role {
  constructor(player, data) {
    super("Debtor", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "GuessRoleOrDie"];
  }
};
