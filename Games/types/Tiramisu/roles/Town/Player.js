const Role = require("../../Role");

module.exports = class Player extends Role {
  constructor(player, data) {
    super("Player", player, data);

    this.alignment = "Town";
    this.cards = ["NounGiver"];
  }
};
