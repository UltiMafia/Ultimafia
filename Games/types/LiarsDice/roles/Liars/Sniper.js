const Role = require("../../Role");

module.exports = class Sniper extends Role {
  constructor(player, data) {
    super("Sniper", player, data);

    this.alignment = "Liars";
    this.cards = ["TownCore", "WinIfLastAlive"];
    this.startItems = ["Gun"];
  }
};
