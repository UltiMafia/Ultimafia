const Role = require("../../Role");

module.exports = class Puppeteer extends Role {
  constructor(player, data) {
    super("Puppeteer", player, data);

    player.controlledPuppets = [];

    this.alignment = "Independent";
    this.cards = ["VillageCore", "Puppeteering", "WinAmongLastTwo"];
  }
};
