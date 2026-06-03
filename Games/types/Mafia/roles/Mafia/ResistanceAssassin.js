const Role = require("../../Role");

module.exports = class ResistanceAssassin extends Role {
  constructor(player, data) {
    super("Resistance Assassin", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction"];
  }
};
