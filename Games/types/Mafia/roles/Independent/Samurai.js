const Role = require("../../Role");

module.exports = class Samurai extends Role {
  constructor(player, data) {
    super("Samurai", player, data);
    this.alignment = "Independent";
    this.cards = ["VillageCore", "Duel", "WinIfWonDuel"];
  };
};
