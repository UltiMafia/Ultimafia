const Role = require("../../Role");

module.exports = class Soldier extends Role {
  constructor(player, data) {
    super("Soldier", player, data);

    this.alignment = "Liars";
    this.cards = ["TownCore", "WinIfLastAlive", "TakeNoDiceOnLieCall"];
  }
};
