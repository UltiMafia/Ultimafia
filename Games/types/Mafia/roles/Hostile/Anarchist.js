const Role = require("../../Role");

module.exports = class Anarchist extends Role {
  constructor(player, data) {
    super("Anarchist", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinIfTimebombKillsTwo", "TimebombGiver"];
  }
};
