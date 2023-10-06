const Role = require("../../Role");

module.exports = class Fascist extends Role {
  constructor(player, data) {
    super("Fascist", player, data);
    this.alignment = "Fascists";
    this.cards = ["GovernmentCore", "WinWithFascists"];
  }
};
