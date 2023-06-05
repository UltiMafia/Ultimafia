const Role = require("../../Role");

module.exports = class Rainmaker extends Role {
  constructor(player, data) {
    super("Rainmaker", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "MakeRain"];
  }
};
