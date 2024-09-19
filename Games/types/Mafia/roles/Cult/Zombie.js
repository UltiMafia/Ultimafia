const Role = require("../../Role");

module.exports = class Zombie extends Role {
  constructor(player, data) {
    super("Zombie", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "Zombify",
      "ConvertImmune",
    ];
  }
};
