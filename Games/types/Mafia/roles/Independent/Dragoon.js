const Role = require("../../Role");

module.exports = class Dragoon extends Role {
  constructor(player, data) {
    super("Dragoon", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinByRevolverKills", "RevolverGiver"];
  }
};
