const Villager = require("./Villager");

module.exports = class VillageIdiot extends Villager {
  constructor(player, data) {
    super("Village Idiot", player, data);
    this.cards = ["Clueless"];
  }
};
