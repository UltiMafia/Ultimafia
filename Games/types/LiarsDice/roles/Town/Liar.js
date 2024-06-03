const Role = require("../../Role");

module.exports = class Player extends Role {
  constructor(player, data) {
    super("Liar", player, data);

    this.alignment = "Liars";
    this.cards = ["TownCore", "GetDice", "GuessDice"];
  }
};
