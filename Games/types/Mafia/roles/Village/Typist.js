const Role = require("../../Role");

module.exports = class Typist extends Role {
  constructor(player, data) {
    super("Typist", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "VotesAnonymousOnDeath"];
  }
};
