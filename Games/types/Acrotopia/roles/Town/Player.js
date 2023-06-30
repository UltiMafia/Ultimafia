const Role = require("../../Role");

module.exports = class Player extends Role {
  constructor(player, data) {
    super("Villager", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinWithTown", "AcronymGiver"];
  }
};
