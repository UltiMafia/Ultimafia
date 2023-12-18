const Role = require("../../Role");

module.exports = class Imposter extends Role {
  constructor(player, data) {
    super("Imposter", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "ImitateRole"];
  }
};
