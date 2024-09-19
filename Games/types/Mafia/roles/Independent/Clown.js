const Role = require("../../Role");

module.exports = class Clown extends Role {
  constructor(player, data) {
    super("Clown", player, data);
    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfMafiaWon", "Oblivious", "ClownAround"];
  }
};
