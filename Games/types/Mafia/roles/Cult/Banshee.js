const Role = require("../../Role");

module.exports = class Banshee extends Role {
  constructor(player, data) {
    super("Banshee", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction",  "ChoirOfRoles"];
  }
};
