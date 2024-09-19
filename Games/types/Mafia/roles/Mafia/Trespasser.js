const Role = require("../../Role");

module.exports = class Trespasser extends Role {
  constructor(player, data) {
    super("Trespasser", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction",  "Visit"];
  }
};
