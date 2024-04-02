const Role = require("../../Role");

module.exports = class GuardDog extends Role {
  constructor(player, data) {
    super("Guard Dog", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "NightTrapper",
    ];
  }
};
