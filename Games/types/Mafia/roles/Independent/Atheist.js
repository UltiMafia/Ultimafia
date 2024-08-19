const Role = require("../../Role");

module.exports = class Atheist extends Role {
  constructor(player, data) {
    super("Atheist", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinWithVillage", "RemoveEvilRoles", "AtheistGame"];
  }
};
