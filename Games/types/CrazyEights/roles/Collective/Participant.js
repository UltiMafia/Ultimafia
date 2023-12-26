const Role = require("../../Role");

module.exports = class Participant extends Role {
  constructor(player, data) {
    super("Participant", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinIfGoalReached"];
  }
};