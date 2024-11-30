const Role = require("../../Role");

module.exports = class Governor extends Role {
  constructor(player, data) {
    super("Governor", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "ResponseGiver"];
  }
};
