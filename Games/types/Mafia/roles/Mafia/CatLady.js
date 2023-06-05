const Role = require("../../Role");

module.exports = class CatLady extends Role {
  constructor(player, data) {
    super("Cat Lady", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "CatGiver"];
  }
};
