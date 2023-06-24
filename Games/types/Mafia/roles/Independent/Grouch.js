const Role = require("../../Role");

module.exports = class Grouch extends Role {
  constructor(player, data) {
    super("Grouch", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinIfAliveWhenVillageLose"];
  }
};
