const Role = require("../../Role");

module.exports = class Actress extends Role {
  constructor(player, data) {
    super("Actress", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "RoleDisguiser",
    ];
  }
};
