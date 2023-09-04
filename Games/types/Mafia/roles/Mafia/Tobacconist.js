const Role = require("../../Role");

module.exports = class Tobacconist extends Role {
  constructor(player, data) {
    super("Tobacconist", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "BlockTargetWhispers",
    ];
  }
};
