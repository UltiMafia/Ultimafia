const Villager = require("./Villager");

module.exports = class Veteran extends Villager {
  constructor(player, data) {
    super("Veteran", player, data);
    this.cards = ["StartWithArmor"];
  }
};
