const Role = require("../../Role");

module.exports = class Grouch extends Role {
  constructor(player, data) {
    super("Grouch", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfAliveWhenVillageLose"];
  }
};
