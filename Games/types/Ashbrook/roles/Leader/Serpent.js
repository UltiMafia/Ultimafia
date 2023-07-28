const Role = require("../../Role");

module.exports = class Serpent extends Role {
  constructor(player, data) {
    super("Serpent", player, data);
    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "SerpentInsanity"];
  }
};
