const Role = require("../../Role");

module.exports = class Cannoneer extends Role {
  constructor(player, data) {
    super("Cannoneer", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "GainGunIfMafiaAbstained"];
  }
};
