const Role = require("../../Role");

module.exports = class Homeopath extends Role {
  constructor(player, data) {
    super("Homeopath", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "NightNurse"];
  }
};
