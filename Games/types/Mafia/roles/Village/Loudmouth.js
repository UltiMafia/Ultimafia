const Villager = require("./Villager");

module.exports = class Loudmouth extends Villager {
  constructor(player, data) {
    super("Loudmouth", player, data);
    this.cards = ["CryOutVisitors", "AllWhispersLeak"];
  }
};
