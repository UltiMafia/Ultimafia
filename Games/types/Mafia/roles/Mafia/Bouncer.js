const Role = require("../../Role");

module.exports = class Bouncer extends Role {
  constructor(player, data) {
    super("Bouncer", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "Rolestopper"];
  }
};
