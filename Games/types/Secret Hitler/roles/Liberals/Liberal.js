const Role = require("../../Role");

module.exports = class Liberal extends Role {
  constructor(player, data) {
    super("Liberal", player, data);
    this.alignment = "Liberals";
    this.cards = ["GovernmentCore"];
  }
};