const Role = require("../../Role");

module.exports = class Toymaker extends Role {
  constructor(player, data) {
    super("Toymaker", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "JackGiver",
    ];
  }
};
