const Role = require("../../Role");

module.exports = class Saint extends Role {
  constructor(player, data) {
    super("Saint", player, data);

    this.alignment = "Town";
    this.cards = ["TownCore", "WinWithTown", "GuessWordOnCondemn"];
    
  }
};
