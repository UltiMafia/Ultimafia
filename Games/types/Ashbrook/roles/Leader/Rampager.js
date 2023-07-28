const Role = require("../../Role");

module.exports = class Rampager extends Role {
  constructor(player, data) {
    super("Rampager", player, data);
    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "NightKillerRampager"];
    this.startItems = ["Rampager1"];
  }
};
