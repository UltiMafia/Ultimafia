const Role = require("../../Role");

module.exports = class Interrogator extends Role {
  constructor(player, data) {
    super("Interrogator", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "JailTarget"];
  }
};
