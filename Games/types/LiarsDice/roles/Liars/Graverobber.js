const Role = require("../../Role");

module.exports = class Graverobber extends Role {
  constructor(player, data) {
    super("Graverobber", player, data);

    this.alignment = "Liars";
    this.cards = ["TownCore", "WinIfLastAlive","GainDiceOnCorrectSpotOnCall"];
  }
};
