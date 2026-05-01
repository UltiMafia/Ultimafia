const Role = require("../../Role");

module.exports = class Painter extends Role {
  constructor(player, data) {
    super("Painter", player, data);
    this.alignment = "Town";
    this.cards = ["TownCore"];
  }
};
