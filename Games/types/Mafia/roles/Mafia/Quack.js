const Role = require("../../Role");

module.exports = class Doctor extends Role {
  constructor(player, data) {
    super("Quack", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "NightSaver"];
  }
};
