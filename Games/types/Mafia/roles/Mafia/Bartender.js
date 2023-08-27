const Role = require("../../Role");

module.exports = class Bartender extends Role {
  constructor(player, data) {
    super("Bartender", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "GetDrunk",
    ];
  }
};
