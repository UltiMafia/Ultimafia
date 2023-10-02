const Role = require("../../Role");

module.exports = class Masquerader extends Role {
  constructor(player, data) {
    super("Masquerader", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "HostMasqueradeBall"];
  }
};
