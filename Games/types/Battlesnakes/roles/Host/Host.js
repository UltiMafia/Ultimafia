const Role = require("../../Role");

module.exports = class Host extends Role {
  constructor(player, data) {
    super("Host", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore"];
  }
};
