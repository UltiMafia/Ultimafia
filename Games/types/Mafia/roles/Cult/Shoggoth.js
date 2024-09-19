const Role = require("../../Role");

module.exports = class Shoggoth extends Role {
  constructor(player, data) {
    super("Shoggoth", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction", 
      "MeetingFaction",
      "Endangered",
      "Kill2AndMustRevive",
    ];
  }
};
